import { createMaintenanceBlocks } from './models/bookingModel.js';
import pool from './db.js';

async function createTestMaintenanceBlocks() {
  try {
    console.log('Creating test maintenance blocks to demonstrate owner slot management...\n');

    const testDate = new Date().toISOString().split('T')[0]; // Today
    const courtId = 1; // Court A1
    const ownerId = 1; // Assuming owner ID 1

    const maintenanceSlots = [
      {
        start_time: '08:00',
        end_time: '09:00'
      },
      {
        start_time: '12:00',
        end_time: '13:00'
      },
      {
        start_time: '16:00',
        end_time: '17:00'
      }
    ];

    console.log(`Creating ${maintenanceSlots.length} maintenance blocks for court ${courtId} on ${testDate}:`);

    const result = await createMaintenanceBlocks(courtId, testDate, maintenanceSlots, ownerId);
    
    console.log(`✅ Created ${result.blocksCreated} maintenance blocks`);
    console.log('\nMaintenance blocks created:');
    maintenanceSlots.forEach(slot => {
      console.log(`  ${slot.start_time}-${slot.end_time}: Blocked for maintenance`);
    });

    console.log('\n✅ Test maintenance blocks creation completed!');
    console.log(`\nNow check the frontend with Court ID: ${courtId} and Date: ${testDate}`);
    console.log('You should see:');
    console.log('- 08:00-09:00 slot highlighted in YELLOW (maintenance/blocked)');
    console.log('- 12:00-13:00 slot highlighted in YELLOW (maintenance/blocked)');
    console.log('- 16:00-17:00 slot highlighted in YELLOW (maintenance/blocked)');
    console.log('- Players should NOT be able to book these slots');
    console.log('- Owners should be able to toggle these slots in the management interface');

  } catch (error) {
    console.error('❌ Error creating maintenance blocks:', error);
  } finally {
    await pool.end();
  }
}

createTestMaintenanceBlocks();