package com.webwizard.expensesmanager.smslistener;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;

import androidx.annotation.NonNull;

public class SmsListenerModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;

    public SmsListenerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        registerSmsReceiver();
    }

    @NonNull
    @Override
    public String getName() {
        return "SmsListener";
    }

    private void registerSmsReceiver() {
        IntentFilter filter = new IntentFilter("android.provider.Telephony.SMS_RECEIVED");
        reactContext.registerReceiver(new SmsReceiver(), filter);
    }

    private class SmsReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        String messageBody = smsMessage.getMessageBody();
                        long timestampMillis = smsMessage.getTimestampMillis();

                        // Create a WritableMap to pass the SMS data
                        WritableMap smsData = Arguments.createMap();
                        smsData.putString("body", messageBody);

                        
                        smsData.putDouble("timestamp", timestampMillis);

                        // Send the WritableMap as the event data
                        sendEvent(reactContext, "onSmsReceived", smsData);
                    }
                }
            }
        }
    }

    private void sendEvent(ReactContext reactContext, String eventName, WritableMap params) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
            .emit(eventName, params);
    }
}
