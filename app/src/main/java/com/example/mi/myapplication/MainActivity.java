package com.example.mi.myapplication;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;


public class MainActivity extends Activity {

    public static final String EXTRA_URL = "ExtraUrl";

    EditText mUrlView;

    WebView mWebView;

    WebEvent mWebEvent;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mUrlView = (EditText) findViewById(R.id.url);

        String extraUrl = getIntent().getStringExtra(EXTRA_URL);
        if (!TextUtils.isEmpty(extraUrl)) {
            mUrlView.setText(extraUrl);
        }

        mWebView = (WebView) findViewById(R.id.webview);
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setBuiltInZoomControls(true);
        settings.setDisplayZoomControls(false);
        settings.setUseWideViewPort(true);

        settings.setDatabaseEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAppCacheEnabled(true);
        settings.setAllowUniversalAccessFromFileURLs(true);

        WebView.setWebContentsDebuggingEnabled(true);

        mWebEvent = new WebEvent();
        mWebView.addJavascriptInterface(mWebEvent, "market");

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
//                    if (TextUtils.isEmpty(view.getUrl())) {
//                        view.loadUrl(url);
//                    } else {
                loadInNewActivity(url);
//                    }
                return true;
            }
        });
        load();

        findViewById(R.id.go).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                loadInNewActivity(null);
            }
        });
    }

    public void load() {
        String urlString = mUrlView.getText().toString();
        if (TextUtils.isEmpty(urlString)) {
            return;
        }

        if(urlString.startsWith("file://") && !urlString.startsWith("file:///")) {
            urlString = "file://" + getFilesDir() + "/" + urlString.substring("file://".length());
        }
        mWebView.loadUrl(urlString);
    }

    public void loadInNewActivity(String url) {
        if (url == null) {
            url = mUrlView.getText().toString();
        }

        MainActivity.loadInNewActivityStatic(url);
    }


    public static MainActivity mCurrentActivity;

    public MainActivity() {
        mCurrentActivity = this;
    }

    public static void loadInNewActivityStatic(String url) {
        if (!TextUtils.isEmpty(url)) {
            if (mCurrentActivity != null) {
                Intent intent = new Intent(mCurrentActivity, MainActivity.class);
                intent.putExtra(EXTRA_URL, url);

                mCurrentActivity.startActivity(intent);
                mCurrentActivity.finish();
            }
        }
    }
}
