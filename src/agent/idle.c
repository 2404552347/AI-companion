/*
 * AI Companion — 空闲时间检测 (C helper)
 *
 * 编译: gcc -O2 -o idle_helper idle.c -framework CoreGraphics -framework Foundation
 *
 * 输出: <idle_seconds> <activity_score_0-100>
 */

#include <CoreGraphics/CoreGraphics.h>
#include <Foundation/Foundation.h>
#include <stdio.h>
#include <time.h>

int main(void) {
    @autoreleasepool {
        // CGEventSourceSecondsSinceLastEventType 直接返回空闲秒数
        double idle_sec = CGEventSourceSecondsSinceLastEventType(
            kCGEventSourceStateHIDSystemState,
            kCGAnyInputEventType
        );

        // Activity score 0-100
        int score;
        if (idle_sec < 5)       score = 100;
        else if (idle_sec < 30)  score = 80;
        else if (idle_sec < 60)  score = 60;
        else if (idle_sec < 120) score = 40;
        else if (idle_sec < 300) score = 20;
        else                     score = 5;

        printf("%.0f %d\n", idle_sec, score);
        return 0;
    }
}
