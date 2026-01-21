import React, { useState, useEffect } from 'react';
import { User, TimeRecord } from '../types';
import { storageService } from '../services/storage';
import { Camera } from '../components/Camera';
import { Button } from '../components/Button';
import { MapPin, Clock, History, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  user: User;
}

export const EmployeeDashboard: React.FC<Props> = ({ user }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRecords();
    getLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRecords = async () => {
    try {
      const userRecords = await storageService.getUserRecords(user.id);
      setRecords(userRecords);
    } catch (e) {
      console.error("Error loading records", e);
    }
  };

  const getLocation = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setLocationError('');
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLocationError('Ative o GPS para continuar');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handlePhotoCapture = (base64: string) => {
    setPhoto(base64);
  };

  const handleSubmit = async (type: 'IN' | 'OUT') => {
    if (!photo) {
      alert("Erro: Foto não encontrada.");
      return;
    }
    if (!location) {
      alert("Erro: Localização necessária. Verifique seu GPS.");
      return;
    }
    
    setSubmitting(true);

    const newRecord: TimeRecord = {
      id: crypto.randomUUID(),
      userId: user.id,
      timestamp: Date.now(),
      type: type,
      photoUrl: photo,
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };

    try {
      await storageService.saveRecord(newRecord);
      await loadRecords();
      setPhoto(null);
      setIsCameraOpen(false);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    } catch (e: any) {
      console.error("Erro completo ao salvar:", e);
      alert(`Erro ao salvar o ponto: ${e.message || JSON.stringify(e)}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getLastAction = () => {
    if (records.length === 0) return 'NONE';
    return records[0].type;
  };

  const lastAction = getLastAction();

  if (isCameraOpen) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6 shadow-sm animate-fade-in border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">Verificação de Foto</h3>
        <Camera onCapture={handlePhotoCapture} />
        
        {photo && (
          <div className="mt-4 flex flex-col gap-3">
            <div className={`p-3 rounded-xl flex items-center gap-3 text-sm ${location ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
               <MapPin className="w-5 h-5 shrink-0" />
               {location ? (
                 <span className="truncate">Lat: {location.coords.latitude.toFixed(4)}, Long: {location.coords.longitude.toFixed(4)}</span>
               ) : (
                 <div className="flex items-center justify-between w-full">
                   <span>Aguardando localização...</span>
                   {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                 </div>
               )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                onClick={() => { setPhoto(null); setIsCameraOpen(false); }}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                disabled={!location || submitting}
                isLoading={submitting}
                onClick={() => handleSubmit(lastAction === 'IN' ? 'OUT' : 'IN')}
                className={!location ? "opacity-50 cursor-not-allowed" : ""}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 animate-slide-down w-[90%] max-w-sm justify-center">
          <div className="bg-green-500 rounded-full p-1">
             <CheckCircle2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-sm">Ponto registrado com sucesso!</span>
        </div>
      )}

      {/* Grid Layout for Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Column: Action Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center h-full flex flex-col justify-center">
            <p className="text-gray-500 text-sm mb-1 uppercase tracking-wider">Status Atual</p>
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 font-bold text-sm mb-8 mx-auto">
              {lastAction === 'IN' ? (
                <><div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div> TRABALHANDO</>
              ) : (
                <><div className="w-3 h-3 rounded-full bg-red-400"></div> FORA DE SERVIÇO</>
              )}
            </div>
            
            {/* Location Verification Widget */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-8 flex items-center justify-between border border-gray-100">
              <div className="flex items-center gap-4 overflow-hidden">
                 <div className={`p-3 rounded-xl shrink-0 ${location ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    <MapPin className="w-6 h-6" />
                 </div>
                 <div className="text-left min-w-0">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Localização GPS</p>
                    {location ? (
                      <p className="text-sm font-mono text-gray-700 truncate font-medium">
                        {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {locationError || 'Verificando...'}
                      </p>
                    )}
                 </div>
              </div>
              <button 
                onClick={getLocation} 
                disabled={loading}
                className="p-3 text-primary-600 hover:bg-white hover:shadow-md rounded-full transition-all"
                title="Atualizar Localização"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <Button 
              fullWidth 
              className="h-20 text-xl shadow-primary-500/40 shadow-xl rounded-2xl"
              disabled={!location && !locationError}
              onClick={() => {
                if (!location) {
                   getLocation();
                   if(locationError) alert("Por favor, habilite o GPS do seu dispositivo.");
                } else {
                   setIsCameraOpen(true);
                }
              }}
            >
              <Clock className="w-7 h-7 mr-3 shrink-0" />
              Registrar {lastAction === 'IN' ? 'Saída' : 'Entrada'}
            </Button>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
                <History className="w-5 h-5 text-primary-500" />
                Histórico Recente
              </h3>
              <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded-md">Últimos 5</span>
            </div>

            <div className="space-y-4">
              {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                  <History className="w-12 h-12 mb-2 opacity-20" />
                  <p>Nenhum registro encontrado.</p>
                </div>
              ) : (
                records.slice(0, 5).map(record => (
                  <div key={record.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary-200 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${record.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {record.type === 'IN' ? 'E' : 'S'}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">
                          {record.type === 'IN' ? 'Entrada' : 'Saída'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(record.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800 text-lg font-mono">
                        {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <a 
                        href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MapPin className="w-3 h-3" /> Ver mapa
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};