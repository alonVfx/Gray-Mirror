import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

const AgentManager = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState([]);
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [newAgent, setNewAgent] = useState({
    name: '',
    identity: '',
    personality: '',
    color: '#3B82F6'
  });

  const agentColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  useEffect(() => {
    // Load agents from Firestore
    loadAgents();
  }, []);

  const loadAgents = async () => {
    // This would load from Firestore
    // For now, we'll use mock data
    const mockAgents = [
      {
        id: '1',
        name: 'אליס',
        identity: 'מהנדסת חלל אופטימית',
        personality: 'יצירתית, אופטימית, אוהבת לחקור פתרונות חדשניים',
        color: '#3B82F6'
      },
      {
        id: '2',
        name: 'בוב',
        identity: 'טייס חלל ציני ומנוסה',
        personality: 'מעשי, ציני, בעל ניסיון רב במשימות מסוכנות',
        color: '#EF4444'
      }
    ];
    setAgents(mockAgents);
  };

  const addAgent = async () => {
    if (!newAgent.name.trim() || !newAgent.identity.trim()) return;

    const agent = {
      id: Date.now().toString(),
      ...newAgent,
      createdAt: new Date().toISOString()
    };

    setAgents(prev => [...prev, agent]);
    setNewAgent({ name: '', identity: '', personality: '', color: '#3B82F6' });
    setIsAddingAgent(false);

    // Save to Firestore
    // await saveAgentToFirestore(agent);
  };

  const updateAgent = async (agentId, updatedData) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId ? { ...agent, ...updatedData } : agent
    ));
    setEditingAgent(null);

    // Update in Firestore
    // await updateAgentInFirestore(agentId, updatedData);
  };

  const deleteAgent = async (agentId) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את הסוכן הזה?')) {
      setAgents(prev => prev.filter(agent => agent.id !== agentId));
      
      // Delete from Firestore
      // await deleteAgentFromFirestore(agentId);
    }
  };

  const startEditing = (agent) => {
    setEditingAgent(agent.id);
  };

  const cancelEditing = () => {
    setEditingAgent(null);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900">ניהול סוכנים</h2>
          <button
            onClick={() => setIsAddingAgent(true)}
            className="flex items-center space-x-2 space-x-reverse bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            <span>הוסף סוכן</span>
          </button>
        </div>

        {/* Add Agent Form */}
        {isAddingAgent && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h3 className="text-md font-medium text-gray-900 mb-4">הוסף סוכן חדש</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  שם הסוכן
                </label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="לדוגמה: אליס"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  זהות/תפקיד
                </label>
                <input
                  type="text"
                  value={newAgent.identity}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, identity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="לדוגמה: מהנדסת חלל"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  אישיות ותכונות
                </label>
                <textarea
                  value={newAgent.personality}
                  onChange={(e) => setNewAgent(prev => ({ ...prev, personality: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="תאר את האישיות והתכונות של הסוכן..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  צבע
                </label>
                <div className="flex space-x-2 space-x-reverse">
                  {agentColors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewAgent(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newAgent.color === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 space-x-reverse mt-4">
              <button
                onClick={addAgent}
                className="flex items-center space-x-2 space-x-reverse bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                <span>שמור</span>
              </button>
              <button
                onClick={() => setIsAddingAgent(false)}
                className="flex items-center space-x-2 space-x-reverse bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
                <span>בטל</span>
              </button>
            </div>
          </div>
        )}

        {/* Agents List */}
        <div className="space-y-4">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              {editingAgent === agent.id ? (
                <EditAgentForm
                  agent={agent}
                  onSave={(updatedData) => updateAgent(agent.id, updatedData)}
                  onCancel={cancelEditing}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: agent.color }}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-600">{agent.identity}</p>
                      {agent.personality && (
                        <p className="text-xs text-gray-500 mt-1">{agent.personality}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 space-x-reverse">
                    <button
                      onClick={() => startEditing(agent)}
                      className="p-2 text-gray-600 hover:text-blue-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="p-2 text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {agents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>אין סוכנים עדיין. הוסף סוכן ראשון כדי להתחיל!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EditAgentForm = ({ agent, onSave, onCancel }) => {
  const [formData, setFormData] = useState(agent);
  const agentColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שם הסוכן
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            זהות/תפקיד
          </label>
          <input
            type="text"
            value={formData.identity}
            onChange={(e) => setFormData(prev => ({ ...prev, identity: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            אישיות ותכונות
          </label>
          <textarea
            value={formData.personality}
            onChange={(e) => setFormData(prev => ({ ...prev, personality: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            צבע
          </label>
          <div className="flex space-x-2 space-x-reverse">
            {agentColors.map(color => (
              <button
                key={color}
                onClick={() => setFormData(prev => ({ ...prev, color }))}
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.color === color ? 'border-gray-400' : 'border-gray-200'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="flex space-x-2 space-x-reverse">
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 space-x-reverse bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          <Save className="h-4 w-4" />
          <span>שמור</span>
        </button>
        <button
          onClick={onCancel}
          className="flex items-center space-x-2 space-x-reverse bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
          <span>בטל</span>
        </button>
      </div>
    </div>
  );
};

export default AgentManager;
