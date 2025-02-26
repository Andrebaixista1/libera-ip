// FRONTEND (AuthIpList.jsx)
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaCheck, FaEdit, FaTrash } from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

function parseDateTimeFromBackend(dateTime) {
  if (!dateTime) return { date: "", time: "00:00:00" };
  const [datePart, timePart] = dateTime.split(" ");
  if (!timePart) {
    return {
      date: datePart.includes("-")
        ? convertYYYYMMDDtoDDMMYYYY(datePart)
        : datePart,
      time: "00:00:00",
    };
  }
  if (datePart.includes("-")) {
    return { date: convertYYYYMMDDtoDDMMYYYY(datePart), time: timePart };
  }
  return { date: datePart, time: timePart };
}

function convertYYYYMMDDtoDDMMYYYY(dateString) {
  const [yyyy, mm, dd] = dateString.split("-");
  if (!yyyy || !mm || !dd) return "";
  return `${dd}/${mm}/${yyyy}`;
}

function convertDDMMYYYYtoYYYYMMDD(dateString) {
  const [dd, mm, yyyy] = dateString.split("/");
  if (!dd || !mm || !yyyy) return "";
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateTimeToDDMMYYYYHHmm(dateTime) {
  if (!dateTime) return "";
  const { date, time } = parseDateTimeFromBackend(dateTime);
  if (!date) return "";
  const [HH, MM] = time.split(":");
  if (!HH || !MM) return date;
  return `${date} ${HH}:${MM}`;
}

function applyDateMask(value) {
  let digits = value.replace(/\D/g, "");
  if (digits.length > 2) {
    digits = digits.slice(0, 2) + "/" + digits.slice(2);
  }
  if (digits.length > 5) {
    digits = digits.slice(0, 5) + "/" + digits.slice(5, 9);
  }
  return digits;
}

function formatNumberBr(value) {
  if (value == null) return "";
  const num = Number(value);
  if (isNaN(num)) return "";
  return num.toLocaleString("pt-BR");
}

function parseNumberBr(value) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number(digits) : 0;
}

export default function AuthIpList() {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ip_address: "",
    description: "",
    data_vencimento: "",
    limite_consultas_mensal: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({
    ip_address: "",
    description: "",
    data_vencimento: "",
    data_vencimento_time: "",
    limite_consultas_mensal: "",
  });
  const [refreshSeconds, setRefreshSeconds] = useState(30);
  const intervalRef = useRef(null);

  const fetchAuthIpList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://api-js-in100.vercel.app/api/auth-ips"
      );
      if (response.data.success) {
        setLista(response.data.data);
      } else {
        console.error("Erro ao buscar dados:", response.data.error);
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (
      !form.ip_address ||
      !form.data_vencimento ||
      !form.limite_consultas_mensal
    )
      return;
    try {
      const datePart = convertDDMMYYYYtoYYYYMMDD(form.data_vencimento);
      const finalDateTime = datePart + " 00:00:00";
      await axios.post("https://api-js-in100.vercel.app/api/auth-ips", {
        ip_address: form.ip_address,
        description: form.description,
        data_vencimento: finalDateTime,
        limite_consultas_mensal: parseNumberBr(form.limite_consultas_mensal),
      });
      setForm({
        ip_address: "",
        description: "",
        data_vencimento: "",
        limite_consultas_mensal: "",
      });
      fetchAuthIpList();
    } catch (error) {
      console.error("Erro ao criar registro:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    const { date, time } = parseDateTimeFromBackend(item.data_vencimento);
    setEditingForm({
      ip_address: item.ip_address,
      description: item.description,
      data_vencimento: date,
      data_vencimento_time: time,
      limite_consultas_mensal: formatNumberBr(item.limite_consultas_mensal),
    });
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    try {
      const datePart = convertDDMMYYYYtoYYYYMMDD(editingForm.data_vencimento);
      const finalDateTime = datePart + " " + editingForm.data_vencimento_time;
      await axios.put(`https://api-js-in100.vercel.app/api/auth-ips/${editingId}`, {
        ip_address: editingForm.ip_address,
        description: editingForm.description,
        data_vencimento: finalDateTime,
        limite_consultas_mensal: parseNumberBr(
          editingForm.limite_consultas_mensal
        ),
      });
      setEditingId(null);
      fetchAuthIpList();
    } catch (error) {
      console.error("Erro ao atualizar registro:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja excluir este registro?")) return;
    try {
      await axios.delete(`https://api-js-in100.vercel.app/api/auth-ips/${id}`);
      fetchAuthIpList();
    } catch (error) {
      console.error("Erro ao excluir registro:", error);
    }
  };

  const handleCreateDateChange = (e) => {
    setForm({ ...form, data_vencimento: applyDateMask(e.target.value) });
  };

  const handleEditDateChange = (e) => {
    setEditingForm({
      ...editingForm,
      data_vencimento: applyDateMask(e.target.value),
    });
  };

  const handleCreateLimitChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (!digits) {
      setForm({ ...form, limite_consultas_mensal: "" });
      return;
    }
    const formatted = Number(digits).toLocaleString("pt-BR");
    setForm({ ...form, limite_consultas_mensal: formatted });
  };

  const handleEditLimitChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (!digits) {
      setEditingForm({ ...editingForm, limite_consultas_mensal: "" });
      return;
    }
    const formatted = Number(digits).toLocaleString("pt-BR");
    setEditingForm({ ...editingForm, limite_consultas_mensal: formatted });
  };

  useEffect(() => {
    fetchAuthIpList();
    intervalRef.current = setInterval(() => {
      setRefreshSeconds((prev) => {
        if (prev <= 1) {
          fetchAuthIpList();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const totalLinhas = lista.length;
  const totalLimite = lista.reduce(
    (acc, item) => acc + (parseInt(item.limite_consultas_mensal, 10) || 0),
    0
  );
  const totalCarregado = lista.reduce(
    (acc, item) => acc + (parseInt(item.carregado, 10) || 0),
    0
  );

  return (
    <div className="container mt-4">
      <h2 className="mb-3">Lista de IPs Autorizados</h2>
      {loading && <p>Carregando...</p>}
      {!loading && (
        <>
          <div className="card mb-4">
            <div className="card-header">Novo Registro</div>
            <div className="card-body">
              <div className="row mb-2">
                <div className="col-md-3">
                  <label>IP Address</label>
                  <input
                    className="form-control"
                    value={form.ip_address}
                    onChange={(e) =>
                      setForm({ ...form, ip_address: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label>Descrição</label>
                  <input
                    className="form-control"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                </div>
                <div className="col-md-3">
                  <label>Data Vencimento (dd/mm/yyyy)</label>
                  <input
                    className="form-control"
                    value={form.data_vencimento}
                    onChange={handleCreateDateChange}
                    placeholder="Ex: 01/01/2030"
                  />
                </div>
                <div className="col-md-3">
                  <label>Limite Consultas</label>
                  <input
                    className="form-control"
                    value={form.limite_consultas_mensal}
                    onChange={handleCreateLimitChange}
                    placeholder="Ex: 50.000"
                  />
                </div>
              </div>
              <button className="btn btn-primary" onClick={handleCreate}>
                Adicionar
              </button>
            </div>
          </div>
          <div className="mb-2">
            <strong>Atualização em: </strong>
            {refreshSeconds}s
            <div
              style={{
                background: "#ddd",
                width: "100%",
                height: "5px",
                marginTop: "5px",
              }}
            >
              <div
                style={{
                  background: "#007bff",
                  width: `${(refreshSeconds / 30) * 100}%`,
                  height: "5px",
                }}
              />
            </div>
          </div>
          <br />
          <table className="table table-bordered table-hover">
            <thead className="thead-dark">
              <tr>
                <th>ID</th>
                <th>IP Address</th>
                <th>Descrição</th>
                <th>Data Ativação</th>
                <th>Data Vencimento (com Hora)</th>
                <th>Limite Consultas Mensal</th>
                <th>Carregado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    {editingId === item.id ? (
                      <input
                        className="form-control"
                        value={editingForm.ip_address}
                        onChange={(e) =>
                          setEditingForm({
                            ...editingForm,
                            ip_address: e.target.value,
                          })
                        }
                      />
                    ) : (
                      item.ip_address
                    )}
                  </td>
                  <td>
                    {editingId === item.id ? (
                      <input
                        className="form-control"
                        value={editingForm.description}
                        onChange={(e) =>
                          setEditingForm({
                            ...editingForm,
                            description: e.target.value,
                          })
                        }
                      />
                    ) : (
                      item.description
                    )}
                  </td>
                  <td>{item.data_ativacao}</td>
                  <td>
                    {editingId === item.id ? (
                      <input
                        className="form-control"
                        value={editingForm.data_vencimento}
                        onChange={handleEditDateChange}
                        placeholder="dd/mm/yyyy"
                      />
                    ) : (
                      formatDateTimeToDDMMYYYYHHmm(item.data_vencimento)
                    )}
                  </td>
                  <td>
                    {editingId === item.id ? (
                      <input
                        className="form-control"
                        value={editingForm.limite_consultas_mensal}
                        onChange={handleEditLimitChange}
                        placeholder="Ex: 50.000"
                      />
                    ) : (
                      formatNumberBr(item.limite_consultas_mensal)
                    )}
                  </td>
                  <td>{formatNumberBr(item.carregado)}</td>
                  <td style={{ width: "120px" }}>
                    {editingId === item.id ? (
                      <OverlayTrigger overlay={<Tooltip>Confirmar</Tooltip>}>
                        <button
                          className="btn btn-success me-2"
                          onClick={handleUpdate}
                        >
                          <FaCheck />
                        </button>
                      </OverlayTrigger>
                    ) : (
                      <OverlayTrigger overlay={<Tooltip>Editar</Tooltip>}>
                        <button
                          className="btn btn-warning me-2"
                          onClick={() => handleEdit(item)}
                        >
                          <FaEdit />
                        </button>
                      </OverlayTrigger>
                    )}
                    <OverlayTrigger overlay={<Tooltip>Excluir</Tooltip>}>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(item.id)}
                      >
                        <FaTrash />
                      </button>
                    </OverlayTrigger>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={8} className="text-center">
                  <b>Total Linhas</b>: {lista.length} | <b>Total Limite</b>:{" "}
                  {formatNumberBr(
                    lista.reduce(
                      (acc, item) =>
                        acc + (parseInt(item.limite_consultas_mensal, 10) || 0),
                      0
                    )
                  )}{" "}
                  | <b>Total Carregado</b>:{" "}
                  {formatNumberBr(
                    lista.reduce(
                      (acc, item) => acc + (parseInt(item.carregado, 10) || 0),
                      0
                    )
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
