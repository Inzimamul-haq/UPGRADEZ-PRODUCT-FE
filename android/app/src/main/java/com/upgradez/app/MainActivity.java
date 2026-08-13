package com.upgradez.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;

import androidx.core.view.WindowCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        // Let the app content extend behind the gesture/navigation area
        WindowCompat.setDecorFitsSystemWindows(window, false);

        // Gesture navigation background is transparent.
        // Your dark app background (#1C1C1B) will show behind it.
        window.setNavigationBarColor(Color.TRANSPARENT);

        // Prevent Android from adding a contrast/white scrim.
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            window.setNavigationBarContrastEnforced(false);
        }
    }
}