function removeRestrictions(){
    importClass(com.stardust.autojs.core.accessibility.AccessibilityBridge.WindowFilter);
    let bridge = runtime.accessibilityBridge;
    let bridgeField = runtime.getClass().getDeclaredField("accessibilityBridge");
    let configField = bridgeField.getType().getDeclaredField("mConfig");
    configField.setAccessible(true);
    configField.set(bridge, configField.getType().newInstance());
    bridge.setWindowFilter(new JavaAdapter(AccessibilityBridge$WindowFilter, {
        filter: function (info) {
            return true;
        }
    }));
}
removeRestrictions();

function encode_b64(){
    let editText = className("EditText").findOne();
    if(editText.text() != "") {
        editText.setText("[密B64]" + $base64.encode(editText.text()));
    }
}

function encode_aes(keyCode){
    let editText = className("EditText").findOne();
    if(editText.text() != "") {
        let key = new $crypto.Key(keyCode);
        editText.setText("[密AES]" + $crypto.encrypt("[密B64]" + $base64.encode(editText.text()), key, "AES", {output: "base64"}));
    }
}

function decodeMsg(){
    let list = textMatches(/^\s*\[密\w{3}\].*/).find();
    for (let i = 0; i < list.size(); i++) {
        let object = list.get(i);
        let talker = getTalker(object);
        let decoded = false;
        let txt = object.text().trim();
        if(txt.indexOf("[密AES]") == 0) {
            if(AESkeys[talker]){
                let key = new $crypto.Key(AESkeys[talker]);
                try{
                    txt = $crypto.decrypt(txt.substr(6), key, "AES", {"input": "base64", "output": "string"}).trim();
                }catch(err){
                    txt = "现有的 " + talker + " 密钥错误！";
                    talker = 'seChat';
                }
            }else{
                txt = "请先联系 " + talker + " 取得密钥！";
                talker = 'seChat';
            }
            decoded = true;
        }
        if(txt.indexOf("[密B64]") == 0) {
            txt = $base64.decode(txt.substr(6));
            decoded = true;
        }

        if(decoded){
            showMsg(talker + " 说：" + txt, object.bounds());
        }
    }
}

function genPassword(pLen, spc){
    if(!pLen){pLen = 16;}
    if(!spc){spc = '!@#$%^&?_';}
    var arr = ('23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ'+spc).split('');
    var arrLen=arr.length;
    while(true){
        var str = '';
        var fNum = false;
        var fLow = false;
        var fUp = false;
        var fSpcl = true;
        if(arrLen > 54){
            fSpcl = false;
        }
        for(var i=0; i<pLen; i++){
            var t=parseInt(Math.random()*arrLen,10);
            if(t<8){fNum = true;}
            if((t>7)&&(t<31)){fLow = true;}
            if((t>30)&&(t<54)){fUp = true;}
            if(t>53){fSpcl = true;}
            str += arr[t];
        }
        if(fNum&&fLow&&fUp&&fSpcl){break;}
    }
    return str;
}

function loadAESkeys(){
    let keyFile = '/sdcard/Download/seChat/keys.txt';
    if(!files.exists(keyFile)){
        files.ensureDir("/sdcard/Download/seChat/");
        files.write(keyFile, "-我自己-="+genPassword());
    }
    let keys = open(keyFile, "r");
    let arr = {};
    while(line = keys.readline()) {
        kv = line.split("=");
        arr[kv[0]] = kv[1];
    }
    return arr;
}

function showMsg(txt, rect){
    let w = floaty.window(
        <frame gravity="center">
            <text alpha="1" textColor="#FFFFFF" bg="#4F4F4F">{txt}</text>
        </frame>
    );
    w.setPosition(rect.left, rect.top);
    w.setAdjustEnabled(true)
}

function getApp(tip){
    let pkgName = currentPackage();
    let actName = currentActivity();
    let path = "/sdcard/Download/seChat/getTalker/";
    let curFile = path+pkgName+".txt";
    if(!files.exists(curFile)){
        files.ensureDir(path);
        if(pkgName == "com.tencent.mm"){
            files.write(curFile, "actName : "+actName+"\nextraCond : o.parent().childCount()>1\n3:1:0:0:desc:头像|Profile Photo");
        }else{
            files.write(curFile, "//可用取值函数\n// text() 屏幕显示文本\n// desc() 描述文本（一般不可见）\n//removeString 需要被清除的字符串\n//不可有空行！可以用注释行分隔不同activity！\nactName : "+actName+"\nextraCond : \nparentLevel:child#:[text|desc]:removeString");
        }
        toastLog("需要手工配置 " + curFile + " 以自动识别密钥。");
    }else{
        if(tip){toastLog("当前APP的识别文件 " + curFile + "已存在。如不能自动识别密钥则可能需要修改。");}
    }
    return {'pkgName':pkgName, 'actName':actName};
}

function isNumeric(value){
    return !isNaN(parseFloat(value)) && isFinite(value);
}

function buildCode(cfgFile){
    let keys = open(cfgFile, "r");
    let arr = [];
    
    let activityTag = false;
    let extraCond = [];
    let talkerTag = false;

    while(line = keys.readline()) {
        line = line.split(":");
        if(line[0].trim() == "actName"){
            if(line[1].trim() != ""){
                activityTag = "curAct.actName == '" + line[1].trim() + "'";
            }
        }

        if(line[0].trim() == "extraCond"){
            if(line[1].trim() != ""){
                extraCond.push(line[1].trim());
            }
        }

        if(isNumeric(line[0].trim())){
            let lsize = line.length;
            talkerTag = "talker = o";
            let p = parseInt(line[0].trim());
            for(let i = 0; i < p; i++){
                talkerTag += ".parent()";
            }

            for(let i = 1; i < lsize; i++){
                if(isNumeric(line[i].trim())){
                    talkerTag += ".child(" + parseInt(line[i].trim()) + ")";
                }else if((line[i].trim()=="text") || (line[i].trim()=="desc")){
                    talkerTag += "." + line[i].trim() + "().trim()";
                }else{
                    talkerTag += ".replace(/" + line[i].trim() + "/, '')";
                }
            }

            talkerTag = talkerTag+";";
            
            for(let i = 0; i < extraCond.length; i++){
                talkerTag = "if(" + extraCond[i] + "){" + talkerTag + "}"; 
            }
            if(activityTag){
                talkerTag = "if(" + activityTag + "){" + talkerTag + "}";
            }

            arr.push(talkerTag);

            talkerTag = false;
            activityTag = false;
            extraCond = [];
        }
    }

    return arr.join("\n");
}

function getTalker(o){
    let talker = "-我自己-";
    let curAct = getApp();
    let path = "/sdcard/Download/seChat/getTalker/";
    if(files.exists(path+curAct.pkgName+".txt")){
        try{
            eval(buildCode(path+curAct.pkgName+".txt"));
        }catch(e){
            toastLog("识别文件有错误！\n" + e);
        }
    }else{
        toastLog("请先识别当前APP并配置识别文件，否则仅能尝试用个人密钥解密。");
    }
    return talker;
}

function loadCustomer(){
    let path = "/sdcard/Download/seChat/encoder/";
    let customer = "";
    if(files.exists(path+"config.txt")){
        let cfg = open(path+"config.txt", "r");
        while(line = cfg.readline()){
            line = line.split("=");
            if(line[0].trim() == "encoder"){
                if(files.exists(path+line[1].trim())){
                    customer = path+line[1].trim();
                }
            }
        }
        if(customer != ""){
            customer = require(customer);
            return customer;
        }else{
            toastLog("引用文件错误！");
            return false;
        }
    }else{
        return false;
    }
}

var AESkeys = loadAESkeys();

var customer = loadCustomer();

float_window();

function float_window() {

    window = floaty.rawWindow(
            <horizontal gravity="center_vertical">
                <img id="icon" src="file://res/seChat.jpeg" w="60" h="60" alpha="0.8" circle="true" borderWidth="1dp" borderColor="black" />

                <horizontal id="drawR">
                    <vertical>
                        <button id="Rui_getApp" textColor="#FFFFFF" text="识别" bg="#4F4F4F" padding="0" h="40" w="60"/>
                        <text text="" h="10" />
                        <button id="Rui_encB64" textColor="#FFFFFF" text="B64" bg="#4F4F4F" padding="0" h="40" w="60"/>
                        <text text="" h="1" />
                        <button id="Rui_encAES" textColor="#FFFFFF" text="AES" bg="#4F4F4F" padding="0" h="40" w="60"/>
                        <text text="" h="1" />
                        <button id="Rui_dec" textColor="#FFFFFF" text="解密" bg="#4F4F4F" padding="0" h="40" w="60"/>
                        <text text="" h="10" id="Rui_customer"/>
                        <button id="Rui_customerEnc" textColor="#FFFFFF" text="自定义加密" bg="#4F4F4F" padding="0" h="40" w="60"/>
                        <text text="" h="1" />
                        <button id="Rui_customerDec" textColor="#FFFFFF" text="自定义解密" bg="#4F4F4F" padding="0" h="40" w="60"/>
                        <text text="" h="10" />
                        <button id="Rui_close" textColor="#FFFFFF" text="退出" bg="#4F4F4F" padding="0" h="40" w="60"/>
                    </vertical>
                </horizontal>
            </horizontal>
    );
    window.setPosition(50, device.height / 3);
    window.exitOnClose();
    setInterval(() => {}, 1000);

    window.drawR.visibility = 8;

    if(customer){
        window.Rui_customerEnc.text(customer.name + "加密");
        window.Rui_customerDec.text(customer.name + "解密");
    }else{
        window.Rui_customer.visibility = 8;
        window.Rui_customerEnc.visibility = 8;
        window.Rui_customerDec.visibility = 8;
    }

    var x = 0, y = 0;
    var windowX, windowY;

    window.icon.setOnTouchListener(function(view, event) {
        switch (event.getAction()) {
            case event.ACTION_DOWN:
                x = event.getRawX();
                y = event.getRawY();
                windowX = window.getX(); // 必须在窗口初始化完成后才能获得相关信息
                windowY = window.getY();
                return true;
            case event.ACTION_MOVE:
                if (Math.abs(event.getRawY() - y) > 5 && Math.abs(event.getRawX() - x) > 5) {
                    window.setPosition(windowX + (event.getRawX() - x), windowY + (event.getRawY() - y));
                }
                return true;
            case event.ACTION_UP:
                if (Math.abs(event.getRawY() - y) < 5 && Math.abs(event.getRawX() - x) < 5) {
                    toggle_draw(event.getRawX());
                }
                return true;
        }
        return true;
    });

    function toggle_draw() {
        let draw = window.drawR;
        draw.visibility == 8 ? draw.visibility = 0 : draw.visibility = 8;
    }

    // 退出按钮事件
    window.Rui_close.setOnTouchListener(function(view, event) {
        if (event.getAction() == event.ACTION_UP) {
            toastLog("正在退出...");
            window.close();
            exit();
        }
        return true;
    });


    //识别按钮事件
    window.Rui_getApp.setOnTouchListener(function(view, event) {
        if (event.getAction() == event.ACTION_UP) {
            window.disableFocus();
            threads.start(function() {
                getApp(true);
            });
        }
        return true;
    });


    //加密按钮事件
    window.Rui_encB64.setOnTouchListener(function(view, event) {
        if (event.getAction() == event.ACTION_UP) {
            window.disableFocus();
            threads.start(function() {
                encode_b64();
            });
        }
        return true;
    });

    window.Rui_encAES.setOnTouchListener(function(view, event) {
        if (event.getAction() == event.ACTION_UP) {
            window.disableFocus();
            threads.start(function() {
                encode_aes(AESkeys["-我自己-"]);
            });
        }
        return true;
    });


    // 解密按钮事件
    window.Rui_dec.setOnTouchListener(function(view, event) {
        if (event.getAction() == event.ACTION_UP) {
            window.disableFocus();
            threads.start(function() {
                decodeMsg();
            });
        }
        return true;
    });

    // 自定义加密按钮事件
    window.Rui_customerEnc.setOnTouchListener(function(view, event) {
        if (event.getAction() == event.ACTION_UP) {
            window.disableFocus();
            threads.start(function() {
                let editText = className("EditText").findOne();
                if(editText.text() != "") {
                    editText.setText(customer.tag + customer.encode(editText.text()));
                }
            });
        }
        return true;
    });


    // 自定义解密按钮事件
    window.Rui_customerDec.setOnTouchListener(function(view, event) {
        if (event.getAction() == event.ACTION_UP) {
            window.disableFocus();
            threads.start(function() {
                let list = textStartsWith(customer.tag).find();
                for (let i = 0; i < list.size(); i++) {
                    let object = list.get(i);
                    let talker = getTalker(object);
                    let decoded = false;
                    try{
                        decoded = customer.decode(object.text().substr(customer.tag.length));
                        showMsg(talker + " 说：" + decoded, object.bounds());
                    }catch(err){
                        showMsg(customer.name + " 解密错误！", object.bounds());
                    }
                }
            });
        }
        return true;
    });
}
