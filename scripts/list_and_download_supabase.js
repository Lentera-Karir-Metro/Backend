/*
Simple script to LIST files in a Supabase bucket and DOWNLOAD a file locally.
Usage:
  - List files: node scripts/list_and_download_supabase.js list <bucket> [prefix]
  - Download file: node scripts/list_and_download_supabase.js download <bucket> <path_in_bucket> <local_output_path>

Make sure environment variables are set:
  - SUPABASE_URL
  - SUPABASE_KEY

Example (Windows cmd):
  set SUPABASE_URL=https://xyz.supabase.co
  set SUPABASE_KEY=eyJhbGciOi...
  node scripts/list_and_download_supabase.js list thumbnails learning-paths

  node scripts/list_and_download_supabase.js download videos "modules/1701516800000-abc123.mp4" .\\downloaded.mp4
*/

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_KEY must be set in environment.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listFiles(bucket, prefix = '') {
  try {
    // list API: from(bucket).list(path, { limit, offset, sortBy })
    const { data, error } = await supabase.storage.from(bucket).list(prefix || '', { limit: 100, offset: 0 });
    if (error) throw error;
    if (!data || data.length === 0) {
      console.log('No files/objects found.');
      return;
    }
    console.log(`Files in bucket='${bucket}' prefix='${prefix}':`);
    data.forEach(item => {
      // item: { name, id?, metadata?, updated_at, last_accessed_at, created_at, size?, type }
      console.log(`- ${item.name}  (${item.type || 'file'})`);
    });
  } catch (err) {
    console.error('List error:', err.message || err);
  }
}

async function downloadFile(bucket, filePath, outPath) {
  try {
    // download: from(bucket).download(path)
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error) throw error;
    // data is a Blob-like / ReadableStream in node: convert to buffer
    const buffer = Buffer.from(await data.arrayBuffer());

    // Ensure folder exists for outPath
    const outDir = path.dirname(outPath);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(outPath, buffer);
    console.log(`Downloaded '${filePath}' → '${outPath}'`);
  } catch (err) {
    console.error('Download error:', err.message || err);
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  if (!cmd) {
    console.log('Usage: list <bucket> [prefix]  |  download <bucket> <path_in_bucket> <local_output_path>');
    process.exit(0);
  }

  if (cmd === 'list') {
    const bucket = argv[1];
    const prefix = argv[2] || '';
    if (!bucket) {
      console.error('Please specify bucket name. e.g. thumbnails, videos, ebooks, certificates');
      process.exit(1);
    }
    await listFiles(bucket, prefix);
  } else if (cmd === 'download') {
    const bucket = argv[1];
    const filePath = argv[2];
    const outPath = argv[3];
    if (!bucket || !filePath || !outPath) {
      console.error('Usage: download <bucket> <path_in_bucket> <local_output_path>');
      process.exit(1);
    }
    await downloadFile(bucket, filePath, outPath);
  } else {
    console.error('Unknown command:', cmd);
    process.exit(1);
  }
}

main();
