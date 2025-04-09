import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function getDefaultDateBr() {
  const now = new Date();
  now.setDate(now.getDate() + 31);
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatDateBrToIso(dateBr) {
  if (!dateBr) return '';
  const [day, month, year] = dateBr.split('/');
  return `${year}-${month}-${day}`;
}

function formatIsoToBr(dateIso) {
  if (!dateIso) return '';
  const dateObj = new Date(dateIso);
  if (isNaN(dateObj.getTime())) {
    const parts = dateIso.split('-');
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts;
      return `${dd}/${mm}/${yyyy}`;
    }
    return dateIso;
  }
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatDateTimeIsoToBr(isoString) {
  if (!isoString) return '';
  const [datePart, timePart] = isoString.split(' ');
  if (!timePart) return formatIsoToBr(datePart);
  const [yyyy, mm, dd] = datePart.split('-');
  const [hh, min] = timePart.split(':');
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

function getDateTimeBrIso() {
  const now = new Date();
  const offset = 180;
  const localMs = now.getTime() - (now.getTimezoneOffset() - offset) * 60000;
  const localDate = new Date(localMs);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const mins = String(localDate.getMinutes()).padStart(2, '0');
  const secs = String(localDate.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
}

function formatNumber(value) {
  if (!value) return '0';
  return parseInt(value, 10).toLocaleString('pt-BR');
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [form, setForm] = useState({
    ip: '',
    descricao: '',
    data_vencimento: getDefaultDateBr(),
    limite_consultas: ''
  });
  const [filters, setFilters] = useState({
    ip: '',
    descricao: '',
    data_inicio: '',
    data_final: ''
  });
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editRecordId, setEditRecordId] = useState(null);
  const [editIp, setEditIp] = useState('');
  const [editId, setEditId] = useState('');

  const loadData = () => {
    fetch('https://api-liberaip.vercel.app/api/ipdata')
      .then(res => res.json())
      .then(data => {
        setRecords(data);
        setFilteredRecords(data);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    const dataAdicaoIso = getDateTimeBrIso();
    const dataVencIso = formatDateBrToIso(form.data_vencimento);

    const newRecord = {
      ip: form.ip,
      descricao: form.descricao.toUpperCase(),
      data_vencimento: dataVencIso,
      limite_consultas: form.limite_consultas,
      total_carregado: form.limite_consultas,
      data_adicao: dataAdicaoIso
    };

    try {
      const res = await fetch('https://api-liberaip.vercel.app/api/ipdata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord)
      });
      if (res.ok) {
        setToastMsg('Registro adicionado com sucesso!');
        loadData();
      } else {
        setToastMsg('Erro ao adicionar registro.');
      }
    } catch (error) {
      setToastMsg('Erro ao adicionar registro.');
    }

    setLoading(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    setForm({
      ip: '',
      descricao: '',
      data_vencimento: getDefaultDateBr(),
      limite_consultas: ''
    });
  };

  const applyFilters = updatedFilters => {
    const filtered = records.filter(record => {
      const ipMatch = record.ip.toLowerCase().includes(updatedFilters.ip.toLowerCase());
      const descricaoMatch = record.descricao.toLowerCase().includes(updatedFilters.descricao.toLowerCase());
      let dateMatch = true;
      if (updatedFilters.data_inicio) {
        const recordDate = record.data_adicao ? record.data_adicao.split(' ')[0] : '';
        if (recordDate < updatedFilters.data_inicio) {
          dateMatch = false;
        }
      }
      if (updatedFilters.data_final) {
        const recordDate = record.data_adicao ? record.data_adicao.split(' ')[0] : '';
        if (recordDate > updatedFilters.data_final) {
          dateMatch = false;
        }
      }
      return ipMatch && descricaoMatch && dateMatch;
    });
    setFilteredRecords(filtered);
  };

  const totalLimiteConsultas = filteredRecords.reduce(
    (sum, record) => sum + parseInt(record.limite_consultas || 0, 10),
    0
  );
  const totalCarregadoSum = filteredRecords.reduce(
    (sum, record) => sum + parseInt(record.total_carregado || 0, 10),
    0
  );

  const calculatePercentualUtilizado = (limite_consultas, total_carregado) => {
    const lim = parseInt(limite_consultas || 0, 10);
    const car = parseInt(total_carregado || 0, 10);
    if (!lim || !car) return '0.00';
    return ((100 - (lim / car) * 100)).toFixed(2);
  };

  const handleEditClick = record => {
    setEditRecordId(record.id);
    setEditIp(record.ip);
    setEditId(String(record.id));
  };

  const handleEditChange = e => {
    setEditIp(e.target.value);
  };

  const handleEditIdChange = e => {
    setEditId(e.target.value);
  };

  const handleSaveEdit = async (recordId) => {
    try {
      const res = await fetch('https://api-liberaip.vercel.app/api/update-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId, ip: editIp }),
      });
  
      const data = await res.json();
  
      if (res.ok && data.success) {
        setToastMsg(data.message);
        loadData();
      } else {
        setToastMsg(`Erro: ${data.error || 'Erro desconhecido'}`);
        console.error(data);
      }
    } catch (error) {
      setToastMsg(`Erro ao atualizar registro: ${error.message}`);
      console.error(error);
    }
  
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setEditRecordId(null);
    setEditIp('');
  };
  
  

  const handleCancelEdit = () => {
    setEditRecordId(null);
    setEditIp('');
    setEditId('');
  };

  return (
    <div className="container mt-4">
      {showToast && (
        <div className="alert alert-info" role="alert">
          {toastMsg}
        </div>
      )}
      {loading && (
        <div className="alert alert-warning" role="alert">
          Processando...
        </div>
      )}

      <div className="card mb-3">
        <div className="card-header">Novo Registro</div>
        <div className="card-body">
          <form className="row g-3 align-items-end" onSubmit={handleSubmit}>
            <div className="col-auto">
              <label className="form-label">IP Address</label>
              <input
                type="text"
                className="form-control"
                name="ip"
                placeholder="000.000.000.000"
                value={form.ip}
                onChange={handleChange}
              />
            </div>
            <div className="col-auto">
              <label className="form-label">Descrição</label>
              <input
                type="text"
                className="form-control"
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
              />
            </div>
            <div className="col-auto">
              <label className="form-label">Data Vencimento (dd/mm/yyyy)</label>
              <input
                type="text"
                className="form-control"
                name="data_vencimento"
                placeholder="Ex: 01/01/2030"
                value={form.data_vencimento}
                onChange={handleChange}
              />
            </div>
            <div className="col-auto">
              <label className="form-label">Limite Consultas</label>
              <input
                type="text"
                className="form-control"
                name="limite_consultas"
                placeholder="Ex: 50.000"
                value={form.limite_consultas}
                onChange={handleChange}
              />
            </div>
            <div className="col-auto">
              <button type="submit" className="btn btn-primary">
                Adicionar
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-header">Filtros</div>
        <div className="card-body">
          <form className="row g-3 align-items-end">
            <div className="col-auto">
              <label className="form-label">Descrição</label>
              <input
                type="text"
                className="form-control"
                name="descricao"
                value={filters.descricao}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-auto">
              <label className="form-label">IP</label>
              <input
                type="text"
                className="form-control"
                name="ip"
                value={filters.ip}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-auto">
              <label className="form-label">Data Início</label>
              <input
                type="date"
                className="form-control"
                name="data_inicio"
                value={filters.data_inicio}
                onChange={handleFilterChange}
              />
            </div>
            <div className="col-auto">
              <label className="form-label">Data Final</label>
              <input
                type="date"
                className="form-control"
                name="data_final"
                value={filters.data_final}
                onChange={handleFilterChange}
              />
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Registros</div>
        <div className="card-body">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>IP</th>
                <th>Descrição</th>
                <th>Data de Adição</th>
                <th>Data de Vencimento</th>
                <th>Limite Consultas</th>
                <th>Total Carregado</th>
                <th>% Utilizado</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => (
                <tr key={record.id}>
                  <td>
                    {editRecordId === record.id ? (
                      <input
                        type="text"
                        className="form-control"
                        value={editId}
                        onChange={handleEditIdChange}
                        style={{ width: '60px' }}
                      />
                    ) : (
                      record.id
                    )}
                  </td>
                  <td>
                    {editRecordId === record.id ? (
                      <input
                        type="text"
                        className="form-control"
                        value={editIp}
                        onChange={handleEditChange}
                      />
                    ) : (
                      record.ip
                    )}
                  </td>
                  <td>{record.descricao}</td>
                  <td>{formatDateTimeIsoToBr(record.data_adicao)}</td>
                  <td>{formatIsoToBr(record.data_vencimento)}</td>
                  <td>{formatNumber(record.limite_consultas)}</td>
                  <td>{formatNumber(record.total_carregado)}</td>
                  <td>{calculatePercentualUtilizado(record.limite_consultas, record.total_carregado)}%</td>
                  <td className="text-center">
                    {editRecordId === record.id ? (
                      <div className="btn-group" role="group">
                        <button className="btn btn-success btn-sm" onClick={() => handleSaveEdit(record.id)}>
                          ✔
                        </button>
                        <button className="btn btn-secondary btn-sm ms-2" onClick={handleCancelEdit}>
                          ✖
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-warning btn-sm" onClick={() => handleEditClick(record)}>
                        ✎
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2">
            <strong>Total Limite Consultas:</strong>{' '}
            {formatNumber(filteredRecords.length ? totalLimiteConsultas : 0)}
          </div>
          <div>
            <strong>Total Carregado:</strong> {formatNumber(totalCarregadoSum)}
          </div>
        </div>
      </div>
    </div>
  );
}
