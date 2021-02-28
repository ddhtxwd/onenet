// tests go here; this will not be compiled when this package is used as a library

OneNET.on_wifi_connected(function () {
    OneNET.OneNET_connect("279878", "550815340", "1234")
    basic.showNumber(1)
})
OneNET.on_mqtt_connected(function () {
    basic.showNumber(2)
})
basic.showNumber(0)
OneNET.WIFI_connect("HiWiFi_505586", "12345678")