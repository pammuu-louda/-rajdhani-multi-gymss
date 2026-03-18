import * as kv from "./kv_store.tsx";

// Seed initial machines if none exist
export async function seedMachines() {
  try {
    const existingMachines = await kv.getByPrefix('machine:');
    
    if (!existingMachines || existingMachines.length === 0) {
      console.log('Seeding initial machines...');
      
      const initialMachines = [
        { id: 'machine_leg_press', name: 'Leg Press', photo: 'https://images.unsplash.com/photo-1735647134600-fd2b75fba36d?w=400', type: 'Leg Equipment', createdAt: new Date().toISOString() },
        { id: 'machine_bench_press', name: 'Bench Press', photo: '', type: 'Chest Equipment', createdAt: new Date().toISOString() },
        { id: 'machine_lat_pulldown', name: 'Lat Pulldown', photo: '', type: 'Back Equipment', createdAt: new Date().toISOString() },
        { id: 'machine_shoulder_press', name: 'Shoulder Press', photo: '', type: 'Shoulder Equipment', createdAt: new Date().toISOString() },
        { id: 'machine_cable_machine', name: 'Cable Machine', photo: '', type: 'Cable Machine', createdAt: new Date().toISOString() },
        { id: 'machine_leg_extension', name: 'Leg Extension', photo: '', type: 'Leg Equipment', createdAt: new Date().toISOString() },
        { id: 'machine_leg_curl', name: 'Leg Curl', photo: '', type: 'Leg Equipment', createdAt: new Date().toISOString() },
      ];

      for (const machine of initialMachines) {
        await kv.set(`machine:${machine.id}`, machine);
      }

      console.log(`Seeded ${initialMachines.length} machines successfully`);
    }
  } catch (error) {
    console.error('Error seeding machines:', error);
  }
}
