using System;
using System.Collections.Concurrent;
using System.IO;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using UnityEngine;

namespace Driftwood
{
    /// <summary>
    /// TCP + 개행 구분 JSON 클라이언트.
    /// 수신은 백그라운드 스레드에서 하고, 메인 스레드는 TryDequeue 로 꺼내 처리한다
    /// (Unity API 는 메인 스레드에서만 호출 가능하기 때문).
    /// 서버 메시지는 항상 '{' 로 시작하므로, 연결 상태 이벤트는 '!' 로 시작하는 문자열로 구분한다.
    /// </summary>
    public sealed class NetClient : IDisposable
    {
        public const string EvConnected = "!connected";
        public const string EvDisconnected = "!disconnected";
        public const string EvErrorPrefix = "!error:";

        readonly ConcurrentQueue<string> inbox = new ConcurrentQueue<string>();
        readonly object writeLock = new object();
        TcpClient tcp;
        StreamWriter writer;
        Thread thread;
        volatile bool running;

        public void Connect(string host, int port)
        {
            running = true;
            thread = new Thread(() => Run(host, port)) { IsBackground = true, Name = "net-reader" };
            thread.Start();
        }

        void Run(string host, int port)
        {
            try
            {
                tcp = new TcpClient { NoDelay = true };
                tcp.Connect(host, port);
                var stream = tcp.GetStream();
                lock (writeLock)
                {
                    writer = new StreamWriter(stream, new UTF8Encoding(false)) { AutoFlush = true, NewLine = "\n" };
                }
                inbox.Enqueue(EvConnected);

                using (var reader = new StreamReader(stream, new UTF8Encoding(false)))
                {
                    string line;
                    while (running && (line = reader.ReadLine()) != null)
                        inbox.Enqueue(line);
                }
            }
            catch (Exception e)
            {
                if (running) inbox.Enqueue(EvErrorPrefix + e.Message);
            }
            finally
            {
                lock (writeLock) writer = null;
                inbox.Enqueue(EvDisconnected);
            }
        }

        public void Send(object message)
        {
            string json = JsonUtility.ToJson(message);
            lock (writeLock)
            {
                if (writer == null) return;
                try { writer.WriteLine(json); }
                catch (Exception) { /* 끊김은 수신 스레드가 감지해서 알린다 */ }
            }
        }

        public bool TryDequeue(out string line) => inbox.TryDequeue(out line);

        public void Dispose()
        {
            running = false;
            try { tcp?.Close(); } catch (Exception) { }
        }
    }
}
