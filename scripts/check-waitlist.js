import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "mongodb+srv://Vercel-Admin-atlas-gray-cave:7NR4Kb8Iev8fA8D7@atlas-gray-cave.wxfcwog.mongodb.net/?retryWrites=true&w=majority";

async function checkWaitlist() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');
    
    const db = client.db('evolucra');
    const collection = db.collection('waitlist');
    
    // Get total count
    const count = await collection.countDocuments();
    console.log(`Total waitlist entries: ${count}\n`);
    
    // Get all entries
    const entries = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    if (entries.length === 0) {
      console.log('No entries in the waitlist yet.');
    } else {
      console.log('Waitlist entries:');
      console.log('─'.repeat(60));
      entries.forEach((entry, i) => {
        console.log(`${i + 1}. ${entry.name}`);
        console.log(`   Email: ${entry.email}`);
        console.log(`   Workshop: ${entry.workshop}`);
        console.log(`   Signed up: ${entry.createdAt?.toLocaleString() || 'N/A'}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

checkWaitlist();
