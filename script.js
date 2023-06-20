/* 
* Copy ../lib/models to /src/models
* Copy ../lib/mail_templates to /src/mail_templates
* Copy ../.env.development to /src
* Copy ../.env.production to /src
*/

const fs = require('fs');
const path = require('path');

class FileManager {

    static isDirectory(path) {
        return fs.lstatSync(path).isDirectory();
    }

    static copySingleFile(src, dest) {
        if (!fs.existsSync(src)) throw new Error('File does not exist');
        const content = fs.readFileSync(src, 'utf8');
        fs.writeFileSync(path.join(dest, path.basename(src)), content, { recursive: true, encoding: 'utf8'});
    }

    static copyFolder(src, dest) {
        if (!fs.existsSync(src)) throw new Error('Folder not found');
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, {recursive: true}); // create the folder
        }

        const {files, folders} = fs.readdirSync(src).reduce((prev, curr) => {
            if (FileManager.isDirectory(path.join(src, curr))) prev.folders.push(curr);
            else prev.files.push(curr);
            return prev;
        }, {files: [], folders: []})

        // copy all the files
        files.forEach(file => FileManager.copySingleFile(path.join(src, file), dest));
        // handle folders here
        if (folders.length) {
            folders.forEach(folder => FileManager.copyFolder(
                path.join(src, folder), 
                path.join(dest, folder)
            ));
        }
    }

    /* 
    * @param src: Source file or folder
    * @param dest: Destination folder
    */
    static copyFile(src, dest) {
        if (FileManager.isDirectory(src)) {
            FileManager.copyFolder(src, dest);
        } else {
            FileManager.copySingleFile(src, dest);
        }
    }

    static copyFiles(copies) {
        copies.forEach(([src, dest]) => {
            FileManager.copyFile(src, dest);
        })
    }
}

const requireFolders = [
    // folders
    'mail_templates',
    'mailer',
    'models',
    'types',
    'utils'
]

const requireFiles = [
    // files
    'app.config.ts',
    'error.ts',
    'mongoose_db_connect.ts',
    'type.ts'
]

const requireEnvs = [
    '.env.development',
    '.env.production',
]

requireFolders.forEach(folder => FileManager.copyFolder(
    path.join(__dirname, `../lib/${folder}`),
    path.join(__dirname, `/src/lib/${folder}`)
))

requireFiles.forEach(file => FileManager.copySingleFile(
    path.join(__dirname, `../lib/${file}`),
    path.join(__dirname, `/src/lib/`)
))

requireEnvs.forEach(file => FileManager.copySingleFile(
    path.join(__dirname, `../${file}`),
    path.join(__dirname, `/`)
))


