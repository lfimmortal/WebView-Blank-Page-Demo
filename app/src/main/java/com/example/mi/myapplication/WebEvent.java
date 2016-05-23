package com.example.mi.myapplication;

import org.json.JSONException;
import org.json.JSONObject;

import android.webkit.JavascriptInterface;

public class WebEvent {
    private static final String TAG = "MarketWebEvent";

    @JavascriptInterface
    public void checkAppsOnMobile(String json) {
    }

    @JavascriptInterface
    public void install(String json) {
    }

    @JavascriptInterface
    public void pause(String json) {
    }

    @JavascriptInterface
    public void resume(String appId) {
    }

    @JavascriptInterface
    public void login(String json) {
    }

    @JavascriptInterface
    public boolean getLocation(String json) {
        return false;
    }

    @JavascriptInterface
    public void registerRockEvent(String json) {
    }

    @JavascriptInterface
    public void vibrate(int vibrateTime) {
    }

    @JavascriptInterface
    public void showToast(String json) {
    }

    @JavascriptInterface
    public void showDialog(String json) {
    }

    @JavascriptInterface
    public void back() {
    }

    @JavascriptInterface
    public boolean checkApis(String json) {
        return true;
    }

    @JavascriptInterface
    public boolean registerViewStatus(String json) {
        return true;
    }

    @JavascriptInterface
    public void removeViewStatus() {
    }

    @JavascriptInterface
    public void registerAppStatus(String json) {
    }

    @JavascriptInterface
    public void removeAppStatus() {
    }

    @JavascriptInterface
    public void registerAppUpdate(String json) {
    }

    @JavascriptInterface
    public void registerNetworkChange(String json) {
    }

    @JavascriptInterface
    public void removeAppUpdate() {
    }

    @JavascriptInterface
    public String getDeviceInfo() {
        return null;
    }

    @JavascriptInterface
    public String getPref(String key) {
        return "";
    }

    @JavascriptInterface
    public boolean openApp(String json) {
        return false;
    }

    @JavascriptInterface
    public void loadPage(String json) {
        try {
            String url = new JSONObject(json).getString("url");
            MainActivity.loadInNewActivityStatic(url);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @JavascriptInterface
    public void loadThirdpartSearch(String json) {
    }

    @JavascriptInterface
    public void getProcessingAppList(String json) {
    }

    @JavascriptInterface
    public boolean isShareAvailable(int flag) {
        return false;
    }

    @JavascriptInterface
    public void share(String json) {
    }

    @JavascriptInterface
    public void viewPermissionDetails(String appId) {
    }

    @JavascriptInterface
    public void favorite(String json) {
    }

    @JavascriptInterface
    public void request(String json) {
    }

    @JavascriptInterface
    public void recordCountEvent(String json) {
    }

    @JavascriptInterface
    public boolean isUseRealTimeDataServer() {
        return false;
    }

    @JavascriptInterface
    public void search(String json) {
    }

    @JavascriptInterface
    public boolean isTabActivity() {
        return true;
    }

    @JavascriptInterface
    public void loadAppScreenshotsPage(String json) {
    }

    @JavascriptInterface
    public String getPageRef() {
        return "";
    }

    @JavascriptInterface
    public boolean allowDownloadDirectly(String json) {
        return false;
    }

    @JavascriptInterface
    public void finish() {
    }

    @JavascriptInterface
    public void finishLoading() {
    }

    @JavascriptInterface
    public int getNetworkStatus() {
        return 2;
    }
}
