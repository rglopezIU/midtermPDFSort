//import packages
const {Storage} = require('@google-cloud/storage')
const path = require('path')
const fs = require('fs-extra')
const os = require('os')
const sharp = require('sharp')
const {BigQuery} = require('@google-cloud/bigquery')


const bq = new BigQuery();
const storage = new Storage();

const uploads = storage.bucket('sp24-41200-rglopez-malpdf-uploads');

exports.sortUploads = async () => {
    try {
        const [files] = await uploads.getFiles();

        // Process each file in files array
        await Promise.all(files.map(async (file) => {
            const fileName = path.basename(file.name);

            try {
                // Query the data table
                const sqlQuery = `SELECT Class FROM \`sp24-41200-rglopez-malpdf.midtermMalware.malwarePDF\` WHERE filename = '${fileName}' LIMIT 1`;
                const options = {
                    query: sqlQuery
                };
                const [rows] = await bq.query(options);

                if (rows.length > 0) {
                    // force lowercase the class in the bq
                    const fileClass = rows[0].Class.toLowerCase();

                    // Define sort bucket
                    let destinationBucket;

                    if (fileClass === "malicious") {
                        destinationBucket = storage.bucket("sp24-41200-rglopez-malpdf-malicious");
                    } else {
                        destinationBucket = storage.bucket("sp24-41200-rglopez-malpdf-benign");
                    }

                    // Copy the file to the destination bucket
                    const destinationFile = destinationBucket.file(fileName);
                    await file.copy(destinationFile);

                    console.log(`File ${fileName} copied to ${fileClass} bucket.`);

                    // Delete the original file from the uploads bucket
                    await file.delete();
                    console.log(`File ${fileName} deleted from uploads bucket.`);
                    
                } else {
                    console.log(`Class not found for file ${fileName}.`);
                }
            } catch (error) {
                console.error(`Error processing file ${fileName}:`, error);
            }
        }));
    } catch (error) {
        console.error("Error retrieving files from uploads bucket:", error);
    }
};
