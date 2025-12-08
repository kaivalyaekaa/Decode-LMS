const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const generateKeys = () => {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    const configDir = path.join(__dirname, '../config');
    if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir);
    }

    fs.writeFileSync(path.join(configDir, 'private.key'), privateKey);
    fs.writeFileSync(path.join(configDir, 'public.key'), publicKey);

    console.log('Keys generated successfully in server/config/');
};

generateKeys();
