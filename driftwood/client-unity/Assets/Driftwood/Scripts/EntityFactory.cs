using UnityEngine;

namespace Driftwood
{
    /// <summary>에셋 없이 기본 도형으로 엔티티 모양을 만든다. 나중에 프리팹으로 교체하면 된다.</summary>
    public static class EntityFactory
    {
        public static EntityView Create(string kind, int id, string displayName, bool isLocal = false)
        {
            var root = new GameObject($"{kind}#{id}");
            switch (kind)
            {
                case "player":
                    Part(root, PrimitiveType.Capsule, new Vector3(0, 1f, 0), new Vector3(0.8f, 1f, 0.8f),
                        isLocal ? new Color(0.95f, 0.75f, 0.25f) : new Color(0.3f, 0.55f, 0.95f));
                    Part(root, PrimitiveType.Cube, new Vector3(0, 1.5f, 0.35f), new Vector3(0.5f, 0.15f, 0.2f), Color.black); // 바라보는 방향 표시
                    break;
                case "tree":
                    Part(root, PrimitiveType.Cylinder, new Vector3(0, 1f, 0), new Vector3(0.35f, 1f, 0.35f), new Color(0.45f, 0.3f, 0.15f));
                    Part(root, PrimitiveType.Sphere, new Vector3(0, 2.6f, 0), new Vector3(2f, 2f, 2f), new Color(0.15f, 0.5f, 0.2f));
                    break;
                case "rock":
                    Part(root, PrimitiveType.Sphere, new Vector3(0, 0.35f, 0), new Vector3(1.3f, 0.8f, 1.1f), new Color(0.5f, 0.5f, 0.52f));
                    break;
                case "bush":
                    Part(root, PrimitiveType.Sphere, new Vector3(0, 0.45f, 0), new Vector3(1.1f, 0.9f, 1.1f), new Color(0.2f, 0.6f, 0.25f));
                    Part(root, PrimitiveType.Sphere, new Vector3(0.3f, 0.75f, 0.3f), Vector3.one * 0.2f, new Color(0.85f, 0.1f, 0.2f));
                    Part(root, PrimitiveType.Sphere, new Vector3(-0.3f, 0.6f, 0.2f), Vector3.one * 0.2f, new Color(0.85f, 0.1f, 0.2f));
                    break;
                default:
                    Part(root, PrimitiveType.Cube, new Vector3(0, 0.5f, 0), Vector3.one, Color.magenta);
                    break;
            }
            if (kind != "player") root.transform.rotation = Quaternion.Euler(0, (id * 37) % 360, 0); // 자연스럽게 회전 다양화

            var view = root.AddComponent<EntityView>();
            view.Id = id;
            view.Kind = kind;
            view.DisplayName = displayName;
            return view;
        }

        public static GameObject CreateGround(float worldSize)
        {
            var ground = GameObject.CreatePrimitive(PrimitiveType.Plane); // Plane 은 10x10 유닛
            ground.name = "Ground";
            ground.transform.position = new Vector3(worldSize / 2f, 0f, worldSize / 2f);
            ground.transform.localScale = new Vector3(worldSize / 10f, 1f, worldSize / 10f);
            ground.GetComponent<Renderer>().material.color = new Color(0.55f, 0.65f, 0.35f);
            return ground;
        }

        static void Part(GameObject parent, PrimitiveType type, Vector3 pos, Vector3 scale, Color color)
        {
            var go = GameObject.CreatePrimitive(type);
            Object.Destroy(go.GetComponent<Collider>()); // 충돌은 서버가 판정하므로 불필요
            go.transform.SetParent(parent.transform, false);
            go.transform.localPosition = pos;
            go.transform.localScale = scale;
            go.GetComponent<Renderer>().material.color = color;
        }
    }
}
