import pool from "../db.js";

async function checkNotificationConstraints() {
  try {
    console.log("🔍 Checking notification table constraints...");

    // Check the table structure
    const tableInfo = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log("\n📋 Notifications table structure:");
    tableInfo.rows.forEach((col) => {
      console.log(
        `   ${col.column_name}: ${col.data_type} ${
          col.is_nullable === "NO" ? "NOT NULL" : "NULL"
        } ${col.column_default ? `DEFAULT ${col.column_default}` : ""}`
      );
    });

    // Check constraints (for newer PostgreSQL versions)
    const constraints = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conrelid = 'notifications'::regclass;
    `);

    console.log("\n🔒 Table constraints:");
    constraints.rows.forEach((constraint) => {
      console.log(
        `   ${constraint.conname} (${constraint.contype}): ${
          constraint.definition || "N/A"
        }`
      );
    });

    // Try to get the allowed notification types
    const typeConstraint = constraints.rows.find(
      (c) => c.conname === "notifications_type_check"
    );
    if (typeConstraint && typeConstraint.definition) {
      console.log("\n📝 Notification type constraint:");
      console.log(`   ${typeConstraint.definition}`);
    }
  } catch (error) {
    console.error("❌ Error checking constraints:", error);
    throw error;
  }
}

// Run the check
checkNotificationConstraints()
  .then(() => {
    console.log("\n🎯 Constraint check completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Check failed:", error);
    process.exit(1);
  });
