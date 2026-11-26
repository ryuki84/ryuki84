using UnityEngine;

namespace Driftwood
{
    /// <summary>
    /// 새 Input System 패키지와 기존 Input Manager 중 프로젝트에 켜진 쪽을 사용한다.
    /// (Unity 6 기본 템플릿은 Input System, 예전 프로젝트는 Input Manager)
    /// </summary>
    public static class InputReader
    {
        public static Vector2 Move()
        {
#if ENABLE_INPUT_SYSTEM
            var k = UnityEngine.InputSystem.Keyboard.current;
            if (k == null) return Vector2.zero;
            float x = (k.dKey.isPressed || k.rightArrowKey.isPressed ? 1f : 0f) - (k.aKey.isPressed || k.leftArrowKey.isPressed ? 1f : 0f);
            float y = (k.wKey.isPressed || k.upArrowKey.isPressed ? 1f : 0f) - (k.sKey.isPressed || k.downArrowKey.isPressed ? 1f : 0f);
#else
            float x = (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow) ? 1f : 0f) - (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow) ? 1f : 0f);
            float y = (Input.GetKey(KeyCode.W) || Input.GetKey(KeyCode.UpArrow) ? 1f : 0f) - (Input.GetKey(KeyCode.S) || Input.GetKey(KeyCode.DownArrow) ? 1f : 0f);
#endif
            var v = new Vector2(x, y);
            return v.sqrMagnitude > 1f ? v.normalized : v;
        }

        public static bool GatherPressed()
        {
#if ENABLE_INPUT_SYSTEM
            var k = UnityEngine.InputSystem.Keyboard.current;
            return k != null && k.eKey.wasPressedThisFrame;
#else
            return Input.GetKeyDown(KeyCode.E);
#endif
        }
    }
}
