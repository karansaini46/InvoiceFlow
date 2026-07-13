const { Queue } = require('bullmq');
const IORedis = require('ioredis');
require('dotenv').config();

const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
const queue = new Queue('send-invoice', { connection });

async function checkQueue() {
  const delayed = await queue.getDelayedCount();
  const waiting = await queue.getWaitingCount();
  const active = await queue.getActiveCount();
  const failed = await queue.getFailedCount();
  
  console.log(`Delayed: ${delayed}`);
  console.log(`Waiting: ${waiting}`);
  console.log(`Active: ${active}`);
  console.log(`Failed: ${failed}`);
  
  const failedJobs = await queue.getFailed();
  if (failedJobs.length > 0) {
    console.log("Failed jobs:");
    failedJobs.forEach(job => {
      console.log(`Job ${job.id}:`, job.failedReason);
    });
  }

  process.exit(0);
}
checkQueue();
