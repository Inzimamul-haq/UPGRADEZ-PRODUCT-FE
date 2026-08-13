package com.upgradez.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // Bottom Android navigation / gesture area
        window.setNavigationBarColor(Color.parseColor("#1C1C1B"));

        // Make the gesture/navigation icons suitable for dark background
        window.getDecorView().setSystemUiVisibility(0);
    }
}