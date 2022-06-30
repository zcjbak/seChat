# seChat
encrypt your message


iOS

快捷指令实现了BASE64对文本信息的加密和解密

HTML

纯原生js实现了BASE64及AES加解密，包括了文本信息和图片。AES所需要的密钥也仅使用localStorage保存在本地（所以请务必备份密钥）。

Android

基于AutoJS Pro开发的脚本，实现了BASE64及AES对文本信息加密。AES所需要的密钥保存在Download/seChat/keys.txt内。

可以通过AutoJS模块的形式自行扩展加解密方式。

可以通过配置文件适配任意即时通讯APP（主要指自动识别发言者，调用密钥）。如果加解密方式不需要个人密钥则无需适配。
