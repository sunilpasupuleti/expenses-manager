// require("dotenv").config();
// const { getDatabase } = require("firebase-admin/database");
// const { Client } = require("@elastic/elasticsearch");

// // Initialize Firebase & Elasticsearch
// const db = getDatabase();
// const esClient = new Client({ node: process.env.ELASTICSEARCH_URL });

// /**
//  * Function to Fetch All Firebase Collections Dynamically
//  */
// async function getFirebaseCollections() {
//   try {
//     const snapshot = await db.ref().once("value");
//     const data = snapshot.val();
//     return data ? Object.keys(data) : [];
//   } catch (err) {
//     console.error("❌ Error fetching Firebase collections:", err);
//     return [];
//   }
// }

// /**
//  * Function to Ensure Elasticsearch Index Exists
//  */
// async function ensureIndex(collection) {
//   const indexName = collection.toLowerCase(); // Convert to lowercase for ES compliance

//   try {
//     const { body: indexExists } = await esClient.indices.exists({
//       index: indexName,
//     });

//     if (!indexExists) {
//       await esClient.indices.create({ index: indexName });
//     }
//   } catch (err) {
//     if (err.meta?.body?.error?.type !== "resource_already_exists_exception") {
//       console.error(`❌ Error ensuring index for ${collection}:`, err);
//     }
//   }
// }

// /**
//  * Function to Sync a Single Document to Elasticsearch
//  */
// async function syncDataToElasticsearch(snapshot, collection) {
//   const data = snapshot.val();
//   const id = snapshot.key;
//   if (!data) return;

//   try {
//     const indexName = collection.toLowerCase();
//     await ensureIndex(collection);

//     // Check if document exists
//     const exists = await esClient.exists({ index: indexName, id: id });

//     if (exists.body) {
//       await esClient.update({
//         index: indexName,
//         id: id,
//         body: { doc: data },
//       });
//     } else {
//       await esClient.index({
//         index: indexName,
//         id: id,
//         body: data,
//       });
//     }
//   } catch (err) {
//     console.error(`❌ Elasticsearch Sync Error in ${collection}/${id}:`, err);
//   }
// }

// /**
//  * Function to Remove Document from Elasticsearch when deleted in Firebase
//  */
// async function deleteFromElasticsearch(snapshot, collection) {
//   const id = snapshot.key;
//   try {
//     await esClient.delete({
//       index: collection.toLowerCase(),
//       id: id,
//     });
//   } catch (err) {
//     console.error(`❌ Delete Error in Elasticsearch: ${collection}/${id}`, err);
//   }
// }

// /**
//  * Function to Sync All Existing Firebase Data to Elasticsearch
//  */
// async function syncAllData() {
//   console.log("🔄 Syncing Firebase data to Elasticsearch...");

//   const collections = await getFirebaseCollections();
//   if (!collections.length) {
//     console.log("⚠️ No collections found in Firebase.");
//     return;
//   }

//   for (const collection of collections) {
//     try {
//       await ensureIndex(collection);
//       const snapshot = await db.ref(collection).once("value");
//       const data = snapshot.val();

//       if (!data) continue;

//       for (const [id, doc] of Object.entries(data)) {
//         await syncDataToElasticsearch({ key: id, val: () => doc }, collection);
//       }
//     } catch (err) {
//       console.error(`❌ Error syncing ${collection}:`, err);
//     }
//   }

//   console.log("✅ Firebase Data Sync Completed!");
// }

// /**
//  * Function to Start Realtime Syncing of Firebase Data with Elasticsearch
//  */
// async function startSyncingElasticsearch() {
//   console.log("🔥 Firebase to Elasticsearch Sync Started...");

//   await syncAllData(); // Initial sync

//   const collections = await getFirebaseCollections();
//   collections.forEach((collection) => {
//     const ref = db.ref(collection);
//     ref.on("child_added", (snapshot) =>
//       syncDataToElasticsearch(snapshot, collection)
//     );
//     ref.on("child_changed", (snapshot) =>
//       syncDataToElasticsearch(snapshot, collection)
//     );
//     ref.on("child_removed", (snapshot) =>
//       deleteFromElasticsearch(snapshot, collection)
//     );
//   });

//   console.log("📡 Listening for Realtime Firebase Updates...");
// }

// // Export function for use in `index.js`
// module.exports = { startSyncingElasticsearch };
