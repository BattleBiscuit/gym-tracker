# Capacitor / WebView bridge — must not be obfuscated
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.PluginMethod public *;
}

# Keep JS interface methods callable from WebView
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# AndroidX / support library
-keep class androidx.** { *; }
-dontwarn androidx.**

# Preserve stack traces for crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
