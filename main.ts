
/**
 * 使用此文件来定义自定义函数和图形块。
 * 想了解更详细的信息，请前往 https://makecode.microbit.org/blocks/custom
 */

/**
 * 自定义图形块
 */
 
enum SonicPingUnit {
	//% block="厘米"
	Centimeters,
	//% block="微秒"
	MicroSeconds,
	//% block="英寸"
	Inches
}
 
//% weight=100 color=#0fbc11 icon="\uf1eb"
namespace OneNET {

    let serial_read: string;
    let receive_id: string;
    let receive_value: string;
    let is_mqtt_conneted = false;
    let is_wifi_conneted = false;
    let is_uart_inited = false;
    
    let wifi_conneted: () => void = null;
    let mqtt_conneted: () => void = null;
    let mqtt_received: () => void = null;

    

    serial.onDataReceived('\n', function () {
        serial_read = serial.readString()
        if (serial_read.includes("AT")) {
            if (serial_read.includes("XMU_WIFI") && serial_read.includes("OK")) {
                is_wifi_conneted = true
                //if (wifi_conneted) wifi_conneted()
            }
            else if (serial_read.includes("ONENET") && serial_read.includes("OK")) {
                is_mqtt_conneted = true
                //if (mqtt_conneted) mqtt_conneted()
            }
            else if (serial_read.includes("RECEIVE")) {
                let start_index = 11
                receive_value = serial_read.substr(start_index, serial_read.length - start_index)
				while (receive_value.length > 0) {
					let c = receive_value.substr(receive_value.length - 1, receive_value.length)
					if (c == '\r' || c == '\n') {
						receive_value = receive_value.substr(0, receive_value.length - 1)
					} else {
						break
					}
				}
                if (mqtt_received) mqtt_received()
            }
        }
    })

    //% block="连接到服务器成功"
    //% subcategory="联网"
    export function is_connected(): boolean {
        return is_mqtt_conneted;
    }
	
	/**
     * 向另一个设备发送信息
     * @param data_id ; eg: "cmd"
     * @param data_value ; eg: "28.5"
    */
    //% block="向另一个设备发送信息 话题名称：$data_id 内容：$data_value"
    //% subcategory="联网"
    export function OneNET_publish(data_id: string, data_value: string): void {

        if(is_mqtt_conneted==false)return;

        let cmd: string = "AT+PUBLISH=" + data_id + ',' + data_value + '\n'
        serial.writeString(cmd)
        basic.pause(100)
    }
	
	/**
     * 开启接收另一个设备的信息
     * @param data_id ; eg: "cmd"
    */
    //% block="开启接收另一个设备的信息 话题名称：$data_id"
    //% subcategory="联网"
    export function OneNET_subscribe(data_id: string): void {
        if(is_mqtt_conneted==false)return;

        let cmd: string = "AT+SUBSCRIBE=" + data_id + '\n'
        serial.writeString(cmd)
        basic.pause(100)
    }

    /**
     * On 收到OneNET的命令
     * @param handler MQTT receiveed callback
    */
    //% block="当收到命令时"
    //% subcategory="联网"
    export function on_mqtt_receiveed(handler: () => void): void {
        mqtt_received = handler;
    }
    
    /**
     * OneNET连接成功
     * @param handler MQTT connected callback
    */
    //% block="OneNET连接成功"
    //% subcategory="联网"
    export function on_mqtt_connected(handler: () => void): void {
        mqtt_conneted = handler;
    }
    
    /**
     * WIFI连接成功
     * @param handler WIFI connected callback
    */
    //% block="WIFI连接成功"
    //% subcategory="联网"
    export function on_wifi_connected(handler: () => void): void {
        wifi_conneted = handler;
    }

    //% block="收到的命令"
    //% subcategory="联网"
    export function get_value(): string {
        return receive_value;
    }
    /**
     * 向OneNET发送信息
     * @param data_id ; eg: "temp"
     * @param data_value ; eg: "28.5"
    */
    //% block="向OneNET发送信息 数据流名称：$data_id 内容：$data_value"
    //% subcategory="联网"
    export function OneNET_send(data_id: string, data_value: string): void {
        if(is_mqtt_conneted==false)return;
        let cmd: string = "AT+ON_SEND=" + data_id + ',' + data_value + '\n'
        serial.writeString(cmd)
        basic.pause(100)
    }
    /**
     * 连接OneNET
     * @param product_id ; eg: "123456"
     * @param machine_id ; eg: "123456789"
     * @param pass ; eg: "1234"
    */
    //% block="连接OneNET 产品ID：$product_id 设备ID：$machine_id 鉴权信息：$pass"
    //% subcategory="联网"
    export function OneNET_connect(product_id: string, machine_id: string, pass: string): void {
        is_mqtt_conneted = false

        let cmd: string = "AT+ONENET=" + product_id + ',' + machine_id + ',' + pass + '\n'
        basic.pause(100)
        while(is_mqtt_conneted==false){
            serial.writeString(cmd)
            let start_time = control.millis()
            while(control.millis() - start_time < 5000){
                basic.pause(10)
                if(is_mqtt_conneted){
                    if (mqtt_conneted) mqtt_conneted()
                    break;
                }
            }
        }
    }

    /**
     * 连接WIFI
     * @param ssid ; eg: "WIFI"
     * @param pass ; eg: "12345678"
    */
    //% block="连接WIFI 名称：$ssid 密码：$pass"
    //% subcategory="联网"
    export function WIFI_connect(ssid: string, pass: string): void {
        is_wifi_conneted = false
        
        serial.redirect(
            SerialPin.P13,
            SerialPin.P14,
            BaudRate.BaudRate115200
        )
        basic.pause(100)
        is_uart_inited = true
        let cmd: string = "AT+XMU_WIFI=" + ssid + ',' + pass + '\n'
        while(is_wifi_conneted==false){
            serial.writeString(cmd)
            let start_time = control.millis()
            while(control.millis() - start_time < 5000){
                basic.pause(100)
                if(is_wifi_conneted){
                    if (wifi_conneted) wifi_conneted()
                    break;
                }
            }
        }
        basic.pause(100)
    }

    /**
     * 显示数字
     * @param x ; eg: 0
     * @param y ; eg: 0
     * @param number ; eg: 666
    */
    //% block="在屏幕的位置第 $y 行第 $x 列上显示数字: $number"  group="物控盒显示"
    //% subcategory="显示"
    export function lcd_display_number(x: number, y: number, number: number): void {
        let cmd: string = "AT+DRAW=" + convertToText(x) + ',' + convertToText(y+1) + ',' + convertToText(number) + '\n'
        if(is_uart_inited == false){
            serial.redirect(
                SerialPin.P13,
                SerialPin.P14,
                BaudRate.BaudRate115200
            )
            basic.pause(100)
            is_uart_inited = true
        }
        serial.writeString(cmd)
        basic.pause(100)
    }

    /**
     * 显示文本
     * @param x ; eg: 0
     * @param y ; eg: 0
     * @param string ; eg: "hello world"
    */
    //% block="在屏幕的位置第 $y 行第 $x 列上显示文本: $string"  group="物控盒显示"
    //% subcategory="显示"
    export function lcd_display_string(x: number, y: number, string: string): void {
        let cmd: string = "AT+DRAW=" + convertToText(x) + ',' + convertToText(y+1) + ',' + string + '\n'
        if(is_uart_inited == false){
            serial.redirect(
                SerialPin.P13,
                SerialPin.P14,
                BaudRate.BaudRate115200
            )
            basic.pause(100)
            is_uart_inited = true
        }
        serial.writeString(cmd)
        basic.pause(100)
    }

    //% block="清除显示"  group="物控盒显示"
    //% subcategory="显示"
    export function lcd_clear(): void {
        let cmd: string = "AT+DRAW=0,1,.Clear.\n"
        if(is_uart_inited == false){
            serial.redirect(
                SerialPin.P13,
                SerialPin.P14,
                BaudRate.BaudRate115200
            )
            basic.pause(100)
            is_uart_inited = true
        }
        serial.writeString(cmd)
        basic.pause(200)
    }
	
	let COMMAND_I2C_ADDRESS = 0x24
    let DISPLAY_I2C_ADDRESS = 0x34
    let _SEG = [0x3F, 0x06, 0x5B, 0x4F, 0x66, 0x6D, 0x7D, 0x07, 0x7F, 0x6F, 0x77, 0x7C, 0x39, 0x5E, 0x79, 0x71];

    let _intensity = 3
    let dbuf = [0, 0, 0, 0]

    /**
     * send command to display
     * @param is command, eg: 0
     */
    function cmd(c: number) {
        pins.i2cWriteNumber(COMMAND_I2C_ADDRESS, c, NumberFormat.Int8BE)
    }

    /**
     * send data to display
     * @param is data, eg: 0
     */
    function dat(bit: number, d: number) {
        pins.i2cWriteNumber(DISPLAY_I2C_ADDRESS + (bit % 4), d, NumberFormat.Int8BE)
    }

    /**
     * turn on display
     */
    //% blockId="TM650_ON" block="开启显示"  group="TM1650数码管"
    //% weight=50 blockGap=8
	//% subcategory="显示"
    export function on() {
        cmd(_intensity * 16 + 1)
    }

    /**
     * turn off display
     */
    //% blockId="TM650_OFF" block="关闭显示"  group="TM1650数码管"
    //% weight=50 blockGap=8
	//% subcategory="显示"
    export function off() {
        _intensity = 0
        cmd(0)
    }

    /**
     * clear display content
     */
    //% blockId="TM650_CLEAR" block="清空显示"  group="TM1650数码管"
    //% weight=40 blockGap=8
	//% subcategory="显示"
    export function clear() {
        dat(0, 0)
        dat(1, 0)
        dat(2, 0)
        dat(3, 0)
        dbuf = [0, 0, 0, 0]
    }

    /**
     * show a digital in given position
     * @param digit is number (0-15) will be shown, eg: 1
     * @param bit is position, eg: 0
     */
    //% blockId="TM650_DIGIT" block="显示数字 %num|在 %bit"  group="TM1650数码管"
    //% weight=80 blockGap=8
    //% num.max=15 num.min=0
	//% subcategory="显示"
    export function digit(num: number, bit: number) {
        dbuf[bit % 4] = _SEG[num % 16]
        dat(bit, _SEG[num % 16])
    }

    /**
     * show a number in display
     * @param num is number will be shown, eg: 100
     */
    //% blockId="TM650_SHOW_NUMBER" block="显示数字 %num"  group="TM1650数码管"
    //% weight=100 blockGap=8
	//% subcategory="显示"
    export function showNumber(num: number) {
        if (num < 0) {
            dat(0, 0x40) // '-'
            num = -num
        }
        else
            digit(Math.idiv(num, 1000) % 10, 0)
        digit(num % 10, 3)
        digit(Math.idiv(num, 10) % 10, 2)
        digit(Math.idiv(num, 100) % 10, 1)
    }

    /**
     * show a number in hex format
     * @param num is number will be shown, eg: 123
     */
    //% blockId="TM650_SHOW_HEX_NUMBER" block="显示16进制数字 %num"  group="TM1650数码管"
    //% weight=90 blockGap=8
	//% subcategory="显示"
    export function showHex(num: number) {
        if (num < 0) {
            dat(0, 0x40) // '-'
            num = -num
        }
        else
            digit((num >> 12) % 16, 0)
        digit(num % 16, 3)
        digit((num >> 4) % 16, 2)
        digit((num >> 8) % 16, 1)
    }

    /**
     * show Dot Point in given position
     * @param bit is positiion, eg: 0
     * @param show is true/false, eg: true
     */
    //% blockId="TM650_SHOW_DP" block="显示小数点在第 %bit|位，同时显示数字 %num"  group="TM1650数码管"
    //% weight=80 blockGap=8
	//% subcategory="显示"
    export function showDpAt(bit: number, show: boolean) {
        if (show) dat(bit, dbuf[bit % 4] | 0x80)
        else dat(bit, dbuf[bit % 4] & 0x7F)
    }

    /**
     * set display intensity
     * @param dat is intensity of the display, eg: 3
     */
    //% blockId="TM650_INTENSITY" block="显示小数点在第 %dat位"  group="TM1650数码管"
    //% weight=70 blockGap=8
	//% subcategory="显示"
    export function setIntensity(dat: number) {
        if ((dat < 0) || (dat > 8))
            return;
        if (dat == 0)
            off()
        else {
            _intensity = dat
            cmd((dat << 4) | 0x01)
        }
    }
    

    /**
     * Send a ping and get the echo time (in microseconds) as a result
     * @param trig tigger pin
     * @param echo echo pin
     * @param unit desired conversion unit
     * @param maxCmDistance maximum distance in centimeters (default is 500)
     */
    //% blockId=sonar_ping block="超声波| trig %trig|echo %echo|单位 %unit"
    //% subcategory="传感器"
    export function ping(trig: DigitalPin, echo: DigitalPin, unit: SonicPingUnit, maxCmDistance = 500): number {
        // send pulse
        pins.setPull(trig, PinPullMode.PullNone);
        pins.digitalWritePin(trig, 0);
        control.waitMicros(2);
        pins.digitalWritePin(trig, 1);
        control.waitMicros(10);
        pins.digitalWritePin(trig, 0);

        // read pulse
        const d = pins.pulseIn(echo, PulseValue.High, maxCmDistance * 58);

        switch (unit) {
            case SonicPingUnit.Centimeters: return Math.idiv(d, 58);
            case SonicPingUnit.Inches: return Math.idiv(d, 148);
            default: return d;
        }
    }

    function signal_dht11(pin: DigitalPin): void {
        pins.digitalWritePin(pin, 0);
        basic.pause(18);
        let i = pins.digitalReadPin(pin);
        pins.setPull(pin, PinPullMode.PullUp);
    }

    function dht11_read(pin: DigitalPin): number {
        signal_dht11(pin);
        let wait_time = 0;
        // Wait for response header to finish
        while (pins.digitalReadPin(pin) == 1);
        while (pins.digitalReadPin(pin) == 0);
        while (pins.digitalReadPin(pin) == 1);

        let value = 0;
        let counter = 0;

        for (let i = 0; i <= 32 - 1; i++) {
            while (pins.digitalReadPin(pin) == 0);
            counter = 0
            while (pins.digitalReadPin(pin) == 1) {
                counter += 1;
            }
            if (counter > 4) {
                value = value + (1 << (31 - i));
            }
        }
        return value;
    }

    export enum Dht11Result {
        //% block="摄氏度"
        Celsius,
        //% block="华氏度"
        Fahrenheit,
        //% block="湿度"
        humidity
    }

    //% blockId=get_DHT11_value block="DHT11 引脚 %pin_arg|获取 %dhtResult" blockExternalInputs=true
    //% pin_arg.fieldEditor="gridpicker" pin_arg.fieldOptions.columns=4
    //% pin_arg.fieldOptions.tooltips="false" pin_arg.fieldOptions.width="300"
    //% subcategory="传感器"
    export function get_DHT11_value(pin_arg: DigitalPin, dhtResult: Dht11Result): number {
        switch (dhtResult) {
            case Dht11Result.Celsius: return (dht11_read(pin_arg) & 0x0000ff00) >> 8;
            case Dht11Result.Fahrenheit: return ((dht11_read(pin_arg) & 0x0000ff00) >> 8) * 9 / 5 + 32;
            case Dht11Result.humidity: return dht11_read(pin_arg) >> 24;
            default: return 0;
        }
    }
}


