'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'catalog_products';
    const desc = await queryInterface.describeTable(table);

    // Add initialPriceCents (copy from existing price_cents if present)
    if (!desc.initialPriceCents) {
      await queryInterface.addColumn(table, 'initialPriceCents', { type: Sequelize.BIGINT, allowNull: true });
      if (desc.price_cents) {
        // copy old price_cents -> initialPriceCents
        await queryInterface.sequelize.query(`UPDATE "${table}" SET "initialPriceCents" = price_cents WHERE price_cents IS NOT NULL;`);
        // drop legacy price_cents column
        await queryInterface.removeColumn(table, 'price_cents');
      }
    }

    // Add other price/cost/rating columns
    if (!desc.proposedPriceCents) {
      await queryInterface.addColumn(table, 'proposedPriceCents', { type: Sequelize.BIGINT, allowNull: true });
    }
    if (!desc.proposedPriceUpdatedAt) {
      await queryInterface.addColumn(table, 'proposedPriceUpdatedAt', { type: Sequelize.DATE, allowNull: true });
    }

    // stock
    if (!desc.stock) {
      await queryInterface.addColumn(table, 'stock', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
    }

    // nameCode (rename sku -> nameCode if sku exists)
    if (desc.sku && !desc.nameCode) {
      try {
        await queryInterface.renameColumn(table, 'sku', 'nameCode');
      } catch (err) {
        // fallback: add new column
        if (!desc.nameCode) {
          await queryInterface.addColumn(table, 'nameCode', { type: Sequelize.STRING, allowNull: true, unique: true });
        }
      }
    } else if (!desc.nameCode) {
      await queryInterface.addColumn(table, 'nameCode', { type: Sequelize.STRING, allowNull: true, unique: true });
    }

    // visibility, images, categories, featured
    if (!desc.isVisible) {
      await queryInterface.addColumn(table, 'isVisible', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });
    }
    if (!desc.images) {
      // Postgres array of text
      await queryInterface.addColumn(table, 'images', { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true });
    }
    if (!desc.categories) {
      await queryInterface.addColumn(table, 'categories', { type: Sequelize.ARRAY(Sequelize.STRING), allowNull: true, defaultValue: [] });
    }
    if (!desc.isFeatured) {
      await queryInterface.addColumn(table, 'isFeatured', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
    }

    // costs and rating
    if (!desc.initialCostCents) {
      await queryInterface.addColumn(table, 'initialCostCents', { type: Sequelize.BIGINT, allowNull: true });
    }
    if (!desc.finalCostCents) {
      await queryInterface.addColumn(table, 'finalCostCents', { type: Sequelize.BIGINT, allowNull: true });
    }
    if (!desc.rating) {
      await queryInterface.addColumn(table, 'rating', { type: Sequelize.FLOAT, allowNull: true, defaultValue: 0 });
    }

    if (!desc.brand) {
      await queryInterface.addColumn(table, 'brand', { type: Sequelize.STRING, allowNull: true });
    }

    // Ensure unique constraint on nameCode
    // (skip if already exists)
    try {
      await queryInterface.addConstraint(table, {
        fields: ['nameCode'],
        type: 'unique',
        name: 'catalog_products_namecode_unique'
      });
    } catch (err) {
      // ignore if constraint exists or cannot be created
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'catalog_products';
    const desc = await queryInterface.describeTable(table);

    // remove columns we added (best-effort)
    const columnsToRemove = [
      'initialPriceCents', 'proposedPriceCents', 'proposedPriceUpdatedAt', 'stock', 'nameCode', 'isVisible', 'images', 'categories', 'isFeatured', 'initialCostCents', 'finalCostCents', 'rating', 'brand'
    ];
    for (const col of columnsToRemove) {
      if (desc[col]) {
        try { await queryInterface.removeColumn(table, col); } catch (err) { /* ignore */ }
      }
    }

    // re-create legacy price_cents if missing
    if (!desc.price_cents) {
      await queryInterface.addColumn(table, 'price_cents', { type: Sequelize.BIGINT, allowNull: false, defaultValue: 0 });
    }
    // attempt to rename nameCode back to sku if sku missing
    if (!desc.sku && desc.nameCode) {
      try { await queryInterface.renameColumn(table, 'nameCode', 'sku'); } catch (err) { /* ignore */ }
    }
  }
};
