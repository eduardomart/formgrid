// Script to cleanup old uploaded files
import { PrismaClient } from '@prisma/client';
import { deleteFile } from '../middleware/fileUpload';
import { getStorageConfig } from '../config/storage';

const prisma = new PrismaClient();

const cleanupOldFiles = async () => {
    const config = getStorageConfig();
    const cleanupAgeDays = parseInt(process.env.FILE_CLEANUP_AGE_DAYS || '30');
    const dryRun = process.env.FILE_CLEANUP_DRY_RUN === 'true';

    console.log(`🧹 Starting file cleanup (${dryRun ? 'DRY RUN' : 'LIVE'})`);
    console.log(`📅 Cleaning files older than ${cleanupAgeDays} days`);

    try {
        // Find submissions older than the cleanup age
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - cleanupAgeDays);

        const oldSubmissions = await prisma.submission.findMany({
            where: {
                createdAt: {
                    lt: cutoffDate
                }
            },
            select: {
                id: true,
                payload: true,
                createdAt: true
            }
        });

        console.log(`📊 Found ${oldSubmissions.length} old submissions`);

        let filesDeleted = 0;
        let errors = 0;

        for (const submission of oldSubmissions) {
            if (submission.payload && typeof submission.payload === 'object') {
                const payload = submission.payload as any;

                // Find file fields in the payload
                for (const [fieldName, value] of Object.entries(payload)) {
                    if (Array.isArray(value) && value.length > 0 && value[0]?.filename) {
                        // Multiple files
                        for (const file of value) {
                            if (file.filename) {
                                try {
                                    if (!dryRun) {
                                        await deleteFile(file.filename);
                                    }
                                    filesDeleted++;
                                    console.log(`${dryRun ? '[DRY RUN] ' : ''}🗑️  Deleted: ${file.filename}`);
                                } catch (error) {
                                    errors++;
                                    console.error(`❌ Failed to delete ${file.filename}:`, error);
                                }
                            }
                        }
                    } else if (value && typeof value === 'object' && value.filename) {
                        // Single file
                        try {
                            if (!dryRun) {
                                await deleteFile(value.filename);
                            }
                            filesDeleted++;
                            console.log(`${dryRun ? '[DRY RUN] ' : ''}🗑️  Deleted: ${value.filename}`);
                        } catch (error) {
                            errors++;
                            console.error(`❌ Failed to delete ${value.filename}:`, error);
                        }
                    }
                }
            }
        }

        console.log(`\n📈 Cleanup Summary:`);
        console.log(`   Files processed: ${filesDeleted + errors}`);
        console.log(`   Files deleted: ${filesDeleted}`);
        console.log(`   Errors: ${errors}`);

        if (dryRun) {
            console.log(`\n⚠️  This was a DRY RUN. No files were actually deleted.`);
            console.log(`   To perform actual cleanup, set FILE_CLEANUP_DRY_RUN=false`);
        }

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

cleanupOldFiles();
