# WebView-Blank-Page-Demo
Demo to show a Android WebView problem.

APK file can be downloaded here: https://github.com/lfimmortal/WebView-Blank-Page-Demo/releases/download/1.0/WebView-Demo.apk

-

Device name:
Xiaomi Mi4, Xiaomi Mi Note, Moto X Style

Android version:
5.1.1, 6.0

WebView version (from system settings -> Apps -> Android System WebView):
50.0.2661.86

Application:
Xiaomi App Market, our Demo(this project)

Application version:

URLs (if applicable):


Steps to reproduce:
(1) Install our demo application, demo web pages are attached in it
(2) Click "Load" button to load page
(3) Repeat several times

Expected result:
pages display normally

Actual result:
With probability about 1/10, WebView display a blank white page.
At this state, utime and stime of thread Chrome_InProcRendererThread and Chrome_InProcGpuThread grow continuous.
Lock and unlock device, the blank white page will turn to display normally.


WebView version 50.0.2661.35 and 46.0.2490.76 do not reproduce this problem.
