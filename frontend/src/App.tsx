import { useState } from 'react';
import { SpatialCanvas } from './components/SpatialCanvas';
import { Lobby } from './components/Lobby';
import { useSocket } from './hooks/useSocket';

function App() {
  const { isConnected } = useSocket('ws://localhost:8000/ws/user_1');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden font-sans">
      {!activeRoomId ? (
        <Lobby onJoin={(id) => setActiveRoomId(id)} />
      ) : (
        <SpatialCanvas
          roomId={activeRoomId}
          onExit={() => setActiveRoomId(null)}
        />
      )}

      {/* Connection Indicator */}
      <div className={`fixed bottom-6 right-6 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase border backdrop-blur-md z-[100] ${isConnected
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
        }`}>
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>
    </div>
  );
}

export default App;
