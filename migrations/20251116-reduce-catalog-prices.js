'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'catalog_products';
    const desc = await queryInterface.describeTable(table);

    // Add finalPriceCents if missing
    if (!desc.finalPriceCents) {
      await queryInterface.addColumn(table, 'finalPriceCents', { type: Sequelize.BIGINT, allowNull: true });

      // Prefer copying from finalCostCents -> finalPriceCents
      if (desc.finalCostCents) {
        await queryInterface.sequelize.query(`UPDATE "${table}" SET "finalPriceCents" = "finalCostCents" WHERE "finalCostCents" IS NOT NULL;`);
      } else if (desc.price_cents) {
        // fallback: copy legacy price_cents
        await queryInterface.sequelize.query(`UPDATE "${table}" SET "finalPriceCents" = "price_cents" WHERE "price_cents" IS NOT NULL;`);
      } else if (desc.initialPriceCents) {
        // last resort: set finalPriceCents = initialPriceCents
        await queryInterface.sequelize.query(`UPDATE "${table}" SET "finalPriceCents" = "initialPriceCents" WHERE "initialPriceCents" IS NOT NULL;`);
      }
    }

    // Remove deprecated price/cost/proposed columns (best-effort)
    const toRemove = [
      'proposedPriceCents',
      'proposedPriceUpdatedAt',
      'initialCostCents',
      'finalCostCents',
      'price_cents',
      'priceCents'
    ];

    for (const col of toRemove) {
      if ((await queryInterface.describeTable(table))[col]) {
        try {
          await queryInterface.removeColumn(table, col);
        } catch (err) {
          // ignore errors to make migration idempotent
          console.warn(`Failed to remove column ${col}:`, err.message || err);
        }
      }
    }

    // Ensure nameCode unique constraint exists (safe to try)
    try {
      await queryInterface.addConstraint(table, {
        fields: ['nameCode'],
        type: 'unique',
        name: 'catalog_products_namecode_unique'
      });
    } catch (err) {
      // ignore if it exists
    }
  },

  async down(queryInterface, Sequelize) {
    const table = 'catalog_products';
    const desc = await queryInterface.describeTable(table);

    // Recreate removed columns as a best-effort rollback
    if (!desc.proposedPriceCents) {
      await queryInterface.addColumn(table, 'proposedPriceCents', { type: Sequelize.BIGINT, allowNull: true });
    }
    if (!desc.proposedPriceUpdatedAt) {
      await queryInterface.addColumn(table, 'proposedPriceUpdatedAt', { type: Sequelize.DATE, allowNull: true });
    }
    if (!desc.initialCostCents) {
      await queryInterface.addColumn(table, 'initialCostCents', { type: Sequelize.BIGINT, allowNull: true });
    }
    if (!desc.finalCostCents) {
      await queryInterface.addColumn(table, 'finalCostCents', { type: Sequelize.BIGINT, allowNull: true });
    }
    if (!desc.price_cents) {
      await queryInterface.addColumn(table, 'price_cents', { type: Sequelize.BIGINT, allowNull: true });
    }

    // Optionally copy back finalPriceCents -> finalCostCents / price_cents
    const cur = await queryInterface.describeTable(table);
    if (cur.finalPriceCents) {
      if (cur.finalCostCents) {
        await queryInterface.sequelize.query(`UPDATE "${table}" SET "finalCostCents" = "finalPriceCents" WHERE "finalPriceCents" IS NOT NULL;`);
      }
      if (cur.price_cents) {
        await queryInterface.sequelize.query(`UPDATE "${table}" SET "price_cents" = "finalPriceCents" WHERE "finalPriceCents" IS NOT NULL;`);
      }
    }

    // Do not remove finalPriceCents on down to avoid accidental data loss
  }
};
