
/**
 * 使用此文件来定义自定义函数和图形块。
 * 想了解更详细的信息，请前往 https://makecode.microbit.org/blocks/custom
 */

/**
 * 自定义图形块
 */
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
                if (wifi_conneted) wifi_conneted()
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
        basic.pause(50)
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
        basic.pause(50)
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
        basic.pause(50)
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
    //% block="在屏幕的位置第 $x 行第 $y 列上显示数字: $number"
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
        basic.pause(50)
    }

    /**
     * 显示文本
     * @param x ; eg: 0
     * @param y ; eg: 0
     * @param string ; eg: "hello world"
    */
    //% block="在屏幕的位置第 $x 行第 $y 列上显示文本: $string"
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
        basic.pause(50)
    }

    //% block="清除显示"
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
        basic.pause(50)
    }

    enum SonicPingUnit {
        //% block="厘米"
        Centimeters,
        //% block="微秒"
        MicroSeconds,
        //% block="英寸"
        Inches
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


