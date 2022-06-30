    let DaLaBengBa = {};

    let path = "/sdcard/Download/seChat/encoder/DaLaBengBa/";
    let cfg = open(path+"config.txt", "r");
    let seq = "0123456789";
    let pos = 1;
    let chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ \`\~\!\@\#\$\%\^\&\*\(\)\-\_\=\+\[\]\{\}\\\|\;\:\'\"\,\<\.\>\/\?";

    while(line = cfg.readline()) {
        line = line.split("=");
        if(line[0].trim() == "seq"){
            if(line[1].trim() != ""){
                seq = line[1].trim();
                if(seq[0] == "-"){
                    pos = -1;
                    seq = seq.substring(1);
                }
            }
        }

        if(line[0].trim() == "db"){
            if(line[1].trim() != ""){
                if(files.exists(path+line[1].trim())){
                    chars += files.read(path+line[1].trim());
                }else{
                    toastLog("字库不存在！");
                }
                
            }
        }
    }

    seq = seq.split("");
    chars = chars.split("");
    let seqLen = seq.length;
    let charsLen = chars.length;

    function replaceStr(txt, pos, char){
        let arr = txt.split("");
        if(pos > 0){
            arr[pos] = char;
        }else{
            arr[arr.length+pos] = char;
        }
        return arr.join("");
    }

    DaLaBengBa.encode = function (txt){
        let txtArr = txt.split("");
        let txtLen = txt.length;
        let seqPt = 0;
        let ret = [];

        let pattern = new RegExp("[\u4E00-\u9FA5]+"); // 判断是否有中文
        if(!pattern.test(txt)){
            chars.splice(95);
            charsLen = chars.length;
        }

        for(let i = 0; i < txtLen; i++){
            let seqN = parseInt(seq[seqPt]);
            let lineLen = Math.floor(Math.random() * (18 - seqN)) + seqN;
            let line = "";
            for(let j = 0; j < lineLen; j++){
                let charPos = Math.floor(Math.random() * charsLen);
                line += chars[charPos];
            }
            ret.push(replaceStr(line, pos*seqN, txtArr[i]));
            seqPt<seqLen-1?seqPt++:seqPt=0;
        }
        return ret.join("\n");
    }

    DaLaBengBa.decode = function (txt){
        let arr = txt.split("\n");
        let arrLen = arr.length;
        let seqPt = 0;
        let str = "";
        for(let i = 0; i < arrLen; i++){
            let seqN = parseInt(seq[seqPt]);
            if(pos > 0){
                str += arr[i][seqN];
            }else{
                str += arr[i][arrLen+pos*seqN];
            }
            seqPt<seqLen-1?seqPt++:seqPt=0;
        }
        return str;
    }

    DaLaBengBa.name = "达拉崩吧";

    DaLaBengBa.tag = "[密达拉]";

    module.exports = DaLaBengBa;