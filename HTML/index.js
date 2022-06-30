            function img2B64(){

                function compressImg(img, rate){
                    let canvas = document.createElement("canvas");
                    let ctx = canvas.getContext("2d");
                    let initSize = img.src.length;
                    let width = img.width;
                    let height = img.height;
                    canvas.width = width;
                    canvas.height = height;
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0, width, height);
                    let ndata = canvas.toDataURL("image/jpeg", rate/100);
                    return ndata;
                }

                let imgFile = document.getElementById('imgFile');
                let showImg = document.getElementById('img');
                let b64 = document.getElementById('b64');
                let comprate = parseInt(document.getElementById('comprate').value);
                let file = imgFile.files[0];
                if(!file) return;

                let reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = function(e) {
                    if(comprate > 99){
                        let data = e.target.result;
                        b64.value = data;
                        if(document.getElementById('isEncrypted').checked) {
                            let key = getOwnKey();
                            key?b64.value = "[密AES]" + aesEncrypt(data, key):key = false;
                        }
                        showImg.src = data;
                        showImg.style = "width:200pt;";
                    }else{
                        let img = new Image();
                        img.src = e.target.result;
                        img.onload = function () {
                            let data = compressImg(img, comprate);
                            b64.value = data;
                            if(document.getElementById('isEncrypted').checked) {
                                let key = getOwnKey();
                                key?b64.value = "[密AES]" + aesEncrypt(data, key):key = false;
                            }
                            showImg.src = data;
                            showImg.style = "width:200pt;";
                        }
                    }
            
                };
            }

            function genPassword(pLen=16, spc='!@#$%^&?_'){
                var arr=('23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ'+spc).split('');
                var arrLen=arr.length;
                while(true){
                    var str='';
                    var fNum=false;
                    var fLow=false;
                    var fUp=false;
                    var fSpcl=true;
                    if(arrLen>54){
                        fSpcl=false;
                    }
                    for(var i=0;i<pLen;i++){
                        var t=parseInt(Math.random()*arrLen,10);
                        if(t<8){fNum=true;}
                        if((t>7)&&(t<31)){fLow=true;}
                        if((t>30)&&(t<54)){fUp=true;}
                        if(t>53){fSpcl=true;}
                        str+=arr[t];
                    }
                    if(fNum&&fLow&&fUp&&fSpcl){break;}
                }
                return str;
            }

            function txt2B64(){
                let b64 = document.getElementById('b64');
                b64.value = "[密B64]" + window.btoa(unescape(encodeURIComponent(b64.value)));
                if(document.getElementById('isEncrypted').checked) {
                    let key = getOwnKey();
                    key?b64.value = "[密AES]" + aesEncrypt(b64.value, key):key = false;
                }
            }

            function getOwnKey(){
                let ops = document.getElementById("friends").options;
                for(let i = 0; i < ops.length; i++) {
                    if(ops[i].text == "-我自己-"){
                        ops[i].selected = true;
                        return ops[i].value;
                    }
                }
                alert('*使用密钥加密请先添加名为“-我自己-”的密钥*\n当前结果仅为BASE64！');
                document.getElementById("markName").value = "-我自己-";
                document.getElementById("aesKey").value = genPassword();
                return false;
            }

            function B64toTxt(){
                let b64 = document.getElementById('b64');
                if((b64.value.indexOf("[密AES]") == 0) || (document.getElementById('isEncrypted').checked)) {
                    document.getElementById('isEncrypted').checked = true;
                    b64.value = aesDecrypt(b64.value.substr(6), document.getElementById('friends').value);
                    if(b64.value.indexOf("data:image") == 0){
                        document.getElementById('img').src = b64.value;
                    }
                }
                if(b64.value.indexOf("data:image") == 0){
                    document.getElementById("img").src = b64.value;
                }else{
                    b64.value = decodeURIComponent(escape(window.atob(b64.value.substr(6))));
                    if(b64.value.indexOf("data:image") == 0){
                        document.getElementById("img").src = b64.value;
                    }
                }
            }

            function cp(){
                let b64 = document.getElementById('b64');
                b64.select();
                if(document.execCommand('copy')){
                    document.execCommand('copy');
                    b64.setSelectionRange(0,0);
                }else{
                    alert('Must be user triggered!');
                }
            }

            function clr(){
                document.getElementById('b64').value = "";
                document.getElementById('img').src = "";
            }

            function aesEncrypt(encryptString, key) {
                var key = CryptoJS.enc.Utf8.parse(key);
                var srcs = CryptoJS.enc.Utf8.parse(encryptString);
                var encrypted = CryptoJS.AES.encrypt(srcs, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
                return encrypted.toString();
            }

            function aesDecrypt(decryptString, key) {
                var key = CryptoJS.enc.Utf8.parse(key);
                var decrypt = CryptoJS.AES.decrypt(decryptString, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
                return CryptoJS.enc.Utf8.stringify(decrypt).toString();
            }

            function addFriend(){
                let mName = document.getElementById("markName");
                let aesKey = document.getElementById("aesKey");
                let op = document.createElement("option");
                op.value = aesKey.value;
                op.text = mName.value;
                document.getElementById("friends").appendChild(op);
                window.localStorage.setItem("seChat-"+mName.value, aesKey.value);
                aesKey.value = "";
                mName.value = "";
                alert("Added");
            }

            function delFriend(){
                let friends = document.getElementById("friends");
                window.localStorage.removeItem("seChat-"+friends.options[friends.selectedIndex].text);
                friends.removeChild(friends.options[friends.selectedIndex]);
                alert("Removed");
            }