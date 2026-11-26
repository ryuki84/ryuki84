using UnityEngine;

namespace Driftwood
{
    /// <summary>서버 엔티티 하나의 화면 표현. 원격 엔티티는 서버 위치로 부드럽게 보간한다.</summary>
    public class EntityView : MonoBehaviour
    {
        public int Id;
        public string Kind;
        public string DisplayName;
        public int Amount;
        public bool Interpolate = true;

        Vector3 target;

        public bool IsPlayer => Kind == "player";
        public bool IsResource => !IsPlayer;

        public void SetTarget(float x, float z, bool snap = false)
        {
            target = new Vector3(x, 0f, z);
            if (snap) transform.position = target;
        }

        public void SetAmount(int amount)
        {
            Amount = amount;
            // 고갈된 자원은 숨긴다(서버가 리스폰하면 다시 보임)
            if (IsResource) gameObject.SetActive(amount > 0);
        }

        public void Face(Vector3 direction)
        {
            direction.y = 0f;
            if (direction.sqrMagnitude < 1e-6f) return;
            transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(direction), 1f - Mathf.Exp(-12f * Time.deltaTime));
        }

        void Update()
        {
            if (!Interpolate) return;
            Vector3 delta = target - transform.position;
            // 프레임레이트와 무관한 지수 보간
            transform.position = Vector3.Lerp(transform.position, target, 1f - Mathf.Exp(-15f * Time.deltaTime));
            if (IsPlayer && delta.sqrMagnitude > 0.0025f) Face(delta);
        }
    }
}
