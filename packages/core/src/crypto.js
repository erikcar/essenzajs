//https://github.com/diafygi/webcrypto-examples?tab=readme-ov-file#aes-cbc

export const crypto = {
    AES: {
        CBC:{
            generateKey: function(){

            },

            generateKey: function(){

            },

            decrypt: function(){
                window.crypto.subtle.decrypt(
                    {
                        name: "AES-CBC",
                        iv: ArrayBuffer(16), //The initialization vector you used to encrypt
                    },
                    key, //from generateKey or importKey above
                    data //ArrayBuffer of the data
                )
                .then(function(decrypted){
                    //returns an ArrayBuffer containing the decrypted data
                    console.log(new Uint8Array(decrypted));
                })
                .catch(function(err){
                    console.error(err);
                });
            }
        },

        GCM:{
            generateKey: function(){
                window.crypto.subtle.generateKey(
                    {
                        name: "AES-GCM",
                        length: 256, //can be  128, 192, or 256
                    },
                    false, //whether the key is extractable (i.e. can be used in exportKey)
                    ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
                )
                .then(function(key){
                    //returns a key object
                    console.log(key);
                })
                .catch(function(err){
                    console.error(err);
                });
            },

            importKey: function(){
                window.crypto.subtle.importKey(
                    "jwk", //can be "jwk" or "raw"
                    {   //this is an example jwk key, "raw" would be an ArrayBuffer
                        kty: "oct",
                        k: "Y0zt37HgOx-BY7SQjYVmrqhPkO44Ii2Jcb9yydUDPfE",
                        alg: "A256GCM",
                        ext: true,
                    },
                    {   //this is the algorithm options
                        name: "AES-GCM",
                    },
                    false, //whether the key is extractable (i.e. can be used in exportKey)
                    ["encrypt", "decrypt"] //can "encrypt", "decrypt", "wrapKey", or "unwrapKey"
                )
                .then(function(key){
                    //returns the symmetric key
                    console.log(key);
                })
                .catch(function(err){
                    console.error(err);
                });
            },

            decrypt: function(){
                window.crypto.subtle.decrypt(
                    {
                        name: "AES-GCM",
                        iv: ArrayBuffer(12), //The initialization vector you used to encrypt
                        additionalData: ArrayBuffer, //The addtionalData you used to encrypt (if any)
                        tagLength: 128, //The tagLength you used to encrypt (if any)
                    },
                    key, //from generateKey or importKey above
                    data //ArrayBuffer of the data
                )
                .then(function(decrypted){
                    //returns an ArrayBuffer containing the decrypted data
                    console.log(new Uint8Array(decrypted));
                })
                .catch(function(err){
                    console.error(err);
                });
            }, 
            
            encrypt: function(){
                window.crypto.subtle.encrypt(
                    {
                        name: "AES-GCM",
                
                        //Don't re-use initialization vectors!
                        //Always generate a new iv every time your encrypt!
                        //Recommended to use 12 bytes length
                        iv: window.crypto.getRandomValues(new Uint8Array(12)),
                
                        //Additional authentication data (optional)
                        additionalData: ArrayBuffer,
                
                        //Tag length (optional)
                        tagLength: 128, //can be 32, 64, 96, 104, 112, 120 or 128 (default)
                    },
                    key, //from generateKey or importKey above
                    data //ArrayBuffer of data you want to encrypt
                )
                .then(function(encrypted){
                    //returns an ArrayBuffer containing the encrypted data
                    console.log(new Uint8Array(encrypted));
                })
                .catch(function(err){
                    console.error(err);
                });
            }
        }
    }
} 

export function hash(string) {
    const utf8 = new TextEncoder().encode(string);
    return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
        //returns the hash as an ArrayBuffer (hashBuffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((bytes) => bytes.toString(16).padStart(2, '0'))
        .join('');
      return hashHex;
    });
  }