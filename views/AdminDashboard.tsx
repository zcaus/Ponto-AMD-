import React, { useState, useEffect } from 'react';
import { User, TimeRecord, UserRole } from '../types';
import { storageService } from '../services/storage';
import { Users, MapPin, Clock, Pencil, Save, Shield, ShieldAlert, FileSpreadsheet, LayoutDashboard, UserCheck, X, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '../components/Button';
import { EmployeeDashboard } from './EmployeeDashboard';
import * as XLSX from 'xlsx';

type Tab = 'MANAGEMENT' | 'MY_POINT';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('MANAGEMENT');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userRecords, setUserRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Image Viewer State
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [exporting, setExporting] = useState(false);
  
  // Editing state
  const [editingRecord, setEditingRecord] = useState<TimeRecord | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editType, setEditType] = useState<'IN' | 'OUT'>('IN');

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const session = await storageService.getCurrentSession();
    setCurrentUser(session);
    loadUsers();
    
    // Set default export dates (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setExportStart(firstDay.toISOString().split('T')[0]);
    setExportEnd(now.toISOString().split('T')[0]);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await storageService.getUsers();
      setUsers(allUsers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      loadUserRecords(selectedUser.id);
    }
  }, [selectedUser]);

  const loadUserRecords = async (userId: string) => {
    setLoading(true);
    try {
      const records = await storageService.getUserRecords(userId);
      setUserRecords(records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (record: TimeRecord) => {
    const dateObj = new Date(record.timestamp);
    setEditDate(dateObj.toISOString().split('T')[0]);
    setEditTime(dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    setEditType(record.type);
    setEditingRecord(record);
  };

  const handleSaveEdit = async () => {
    if (!editingRecord) return;

    try {
      const newTimestamp = new Date(`${editDate}T${editTime}`).getTime();
      
      const updatedRecord = {
        ...editingRecord,
        timestamp: newTimestamp,
        type: editType
      };

      await storageService.updateRecord(updatedRecord);
      
      const updatedList = userRecords.map(r => r.id === updatedRecord.id ? updatedRecord : r);
      updatedList.sort((a, b) => b.timestamp - a.timestamp);
      
      setUserRecords(updatedList);
      setEditingRecord(null);
    } catch (e) {
      alert('Erro ao atualizar registro');
    }
  };

  const toggleRole = async (targetUser: User, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (targetUser.id === currentUser?.id) {
      alert("Você não pode alterar seu próprio nível de acesso.");
      return;
    }

    const newRole = targetUser.role === UserRole.ADMIN ? UserRole.EMPLOYEE : UserRole.ADMIN;
    const confirmMsg = newRole === UserRole.ADMIN 
      ? `Promover ${targetUser.fullName} para Administrador?` 
      : `Remover acesso de Administrador de ${targetUser.fullName}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await storageService.updateUserRole(targetUser.id, newRole);
      setUsers(users.map(u => u.id === targetUser.id ? { ...u, role: newRole } : u));
    } catch (error) {
      alert("Erro ao alterar permissão.");
    }
  };

  const handleExport = async () => {
    if (!exportStart || !exportEnd) {
      alert('Selecione as datas de início e fim.');
      return;
    }

    setExporting(true);
    try {
      const startTimestamp = new Date(exportStart + 'T00:00:00').getTime();
      const endTimestamp = new Date(exportEnd + 'T23:59:59').getTime();

      const records = await storageService.getRecordsByRange(startTimestamp, endTimestamp);
      
      let currentUsers = users;
      if (currentUsers.length === 0) {
        currentUsers = await storageService.getUsers();
        setUsers(currentUsers);
      }

      const data = records.map(r => {
        const user = currentUsers.find(u => u.id === r.userId);
        const dateObj = new Date(r.timestamp);
        
        return {
          "Nome do Funcionário": user ? user.fullName : 'Desconhecido',
          "CPF": user ? user.username : 'N/A',
          "Data": dateObj.toLocaleDateString(),
          "Hora": dateObj.toLocaleTimeString(),
          "Tipo": r.type === 'IN' ? 'ENTRADA' : 'SAÍDA',
          "Latitude": r.latitude,
          "Longitude": r.longitude,
          "Link Mapa": `https://www.google.com/maps?q=${r.latitude},${r.longitude}`
        };
      });

      if (data.length === 0) {
        alert("Nenhum registro encontrado no período selecionado.");
        setExporting(false);
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Ponto");
      
      const wscols = [
        {wch: 30}, {wch: 15}, {wch: 12}, {wch: 10}, {wch: 10}, {wch: 12}, {wch: 12}, {wch: 50},
      ];
      worksheet['!cols'] = wscols;

      XLSX.writeFile(workbook, `Relatorio_${exportStart}_a_${exportEnd}.xlsx`);
      setIsExportModalOpen(false);

    } catch (e) {
      console.error(e);
      alert('Erro ao gerar relatório Excel.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 relative pb-20 md:pb-0">
      {/* Navigation Tabs (Top) */}
      <div className="flex p-1 bg-gray-200 rounded-xl md:w-fit md:min-w-[400px]">
        <button
          onClick={() => setActiveTab('MANAGEMENT')}
          className={`flex-1 py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'MANAGEMENT' 
              ? 'bg-white text-primary-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Gestão de Equipe
        </button>
        <button
          onClick={() => setActiveTab('MY_POINT')}
          className={`flex-1 py-2 px-4 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
            activeTab === 'MY_POINT' 
              ? 'bg-white text-primary-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Meu Ponto
        </button>
      </div>

      {activeTab === 'MY_POINT' && currentUser ? (
        <div className="animate-fade-in">
           <EmployeeDashboard user={currentUser} />
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in relative">
          
          {selectedUser ? (
            // === USER DETAILS VIEW ===
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[60vh]">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-primary-600 transition-colors"
                    title="Voltar"
                  >
                    ←
                  </button>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <Users className="w-6 h-6 text-primary-500" />
                      {selectedUser.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 ml-1">CPF: {selectedUser.username}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full h-fit ${selectedUser.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {selectedUser.role === UserRole.ADMIN ? 'Admin' : 'Funcionário'}
                  </span>
                </div>
              </div>

              {loading ? (
                 <div className="text-center py-20 text-gray-400">Carregando registros...</div>
              ) : userRecords.length === 0 ? (
                 <div className="text-center py-20 text-gray-400 bg-gray-50 rounded-xl">Nenhum registro encontrado para este usuário.</div>
              ) : (
                <>
                  {/* MOBILE LIST (Cards) */}
                  <div className="space-y-4 md:hidden">
                    {userRecords.map(record => (
                      <div key={record.id} className="relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                        <div className={`p-3 flex justify-between items-center ${record.type === 'IN' ? 'bg-green-50' : 'bg-orange-50'}`}>
                          <span className={`font-bold ${record.type === 'IN' ? 'text-green-700' : 'text-orange-700'}`}>
                            {record.type === 'IN' ? 'ENTRADA' : 'SAÍDA'}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 font-mono flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(record.timestamp).toLocaleString()}
                            </span>
                            <button onClick={() => handleEditClick(record)} className="p-1.5 bg-white rounded-full text-gray-500 shadow-sm">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4 flex gap-4">
                          <div 
                            className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-zoom-in"
                            onClick={() => setViewingImage(record.photoUrl)}
                          >
                            <img src={record.photoUrl} className="w-full h-full object-cover transform scale-x-[-1]" alt="" />
                          </div>
                          <div className="flex-1 text-sm space-y-1">
                            <div className="flex items-center gap-2 text-gray-600">
                               <MapPin className="w-4 h-4 text-primary-500" />
                               <span>{record.latitude.toFixed(5)}, {record.longitude.toFixed(5)}</span>
                            </div>
                            <a href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline block mt-2">
                              Ver no Mapa
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* DESKTOP TABLE */}
                  <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200">
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 text-gray-700 font-bold uppercase text-xs">
                        <tr>
                          <th className="p-4">Tipo</th>
                          <th className="p-4">Data/Hora</th>
                          <th className="p-4">Localização</th>
                          <th className="p-4">Foto</th>
                          <th className="p-4 text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {userRecords.map(record => (
                          <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${record.type === 'IN' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {record.type === 'IN' ? 'ENTRADA' : 'SAÍDA'}
                              </span>
                            </td>
                            <td className="p-4 font-mono text-gray-800">
                              {new Date(record.timestamp).toLocaleString()}
                            </td>
                            <td className="p-4">
                              <a 
                                href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex items-center gap-1 text-primary-600 hover:text-primary-800"
                              >
                                <MapPin className="w-4 h-4" />
                                {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                              </a>
                            </td>
                            <td className="p-4">
                              <div 
                                className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 cursor-zoom-in hover:ring-2 hover:ring-primary-400 transition-all"
                                onClick={() => setViewingImage(record.photoUrl)}
                              >
                                <img src={record.photoUrl} className="w-full h-full object-cover transform scale-x-[-1]" alt="Proof" />
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => handleEditClick(record)}
                                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          ) : (
            // === USERS LIST VIEW ===
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 min-h-[50vh]">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-gray-800 text-xl">Colaboradores</h3>
                  <button onClick={loadUsers} className="text-primary-600 text-sm hover:underline flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Atualizar Lista
                  </button>
               </div>
               
               {/* Grid for users (1 col mobile, 2 col tablet, 3 col desktop) */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {loading ? (
                    <div className="col-span-full text-center text-gray-400 py-12">Carregando...</div>
                 ) : users.map(user => (
                   <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className="p-5 rounded-2xl bg-gray-50 hover:bg-white hover:shadow-md hover:border-primary-100 transition-all border border-gray-100 flex items-center justify-between group cursor-pointer"
                   >
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm ${user.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-600' : 'bg-primary-100 text-primary-600'}`}>
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-800 group-hover:text-primary-700 line-clamp-1">{user.fullName}</p>
                          </div>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{user.username}</p>
                          {user.role === UserRole.ADMIN && (
                              <span className="inline-block mt-1 bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold">ADMIN</span>
                          )}
                        </div>
                     </div>
                     
                     <div className="flex items-center gap-2">
                       <button
                         onClick={(e) => toggleRole(user, e)}
                         className={`p-2 rounded-full transition-colors ${user.role === UserRole.ADMIN ? 'text-purple-600 hover:bg-purple-50' : 'text-gray-300 hover:text-purple-400 hover:bg-gray-100'}`}
                         title={user.role === UserRole.ADMIN ? "Remover Admin" : "Tornar Admin"}
                       >
                         {user.role === UserRole.ADMIN ? <Shield className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                       </button>
                     </div>
                   </div>
                 ))}
                 {!loading && users.length === 0 && (
                    <p className="col-span-full text-gray-400 text-center">Nenhum funcionário cadastrado.</p>
                 )}
               </div>
            </div>
          )}

          {/* Floating Action Button (FAB) for Export */}
          {!selectedUser && (
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="fixed bottom-6 left-6 md:left-auto md:right-8 md:bottom-8 w-14 h-14 bg-green-600 text-white rounded-full shadow-2xl shadow-green-600/40 flex items-center justify-center hover:bg-green-700 hover:scale-105 transition-all z-30"
              title="Exportar para Excel"
            >
              <FileSpreadsheet className="w-7 h-7" />
            </button>
          )}

        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                 <FileSpreadsheet className="w-5 h-5 text-green-600" />
                 Exportar Excel
               </h3>
               <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                 <X className="w-5 h-5" />
               </button>
             </div>
             
             <div className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Data Início</label>
                  <input 
                    type="date" 
                    value={exportStart}
                    onChange={e => setExportStart(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                  />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Data Fim</label>
                  <input 
                    type="date" 
                    value={exportEnd}
                    onChange={e => setExportEnd(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl"
                  />
               </div>
               
               <div className="pt-4">
                 <Button onClick={handleExport} isLoading={exporting} fullWidth className="bg-green-600 hover:bg-green-700 shadow-green-600/30">
                    Baixar .XLSX
                 </Button>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary-500" />
              Editar Ponto
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Data</label>
                <input 
                  type="date" 
                  value={editDate}
                  onChange={e => setEditDate(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Hora</label>
                <input 
                  type="time" 
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Tipo</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditType('IN')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${editType === 'IN' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-500 border border-transparent'}`}
                  >
                    Entrada
                  </button>
                  <button
                    onClick={() => setEditType('OUT')}
                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${editType === 'OUT' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-50 text-gray-500 border border-transparent'}`}
                  >
                    Saída
                  </button>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button variant="secondary" fullWidth onClick={() => setEditingRecord(null)}>
                  Cancelar
                </Button>
                <Button fullWidth onClick={handleSaveEdit}>
                  <Save className="w-4 h-4" /> Salvar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal (Full Screen) */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setViewingImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-white/10"
            onClick={() => setViewingImage(null)}
          >
            <X className="w-8 h-8" />
          </button>
          
          <img 
            src={viewingImage} 
            alt="Full size" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg transform scale-x-[-1] shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};