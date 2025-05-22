import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import './UbigeoSelector.css'; // Archivo CSS para los estilos

const UbigeoSelector = ({ onLocationChange }) => {
    const [pais, setPais] = useState('');
    const [departamento, setDepartamento] = useState('');
    const [provincia, setProvincia] = useState('');
    const [distrito, setDistrito] = useState('');
    const [ciudadExtranjera, setCiudadExtranjera] = useState('');
    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [distritos, setDistritos] = useState([]);

    // Opciones de países con banderas
    const paises = [
        { value: 'Perú', label: 'Perú', flag: 'https://flagcdn.com/w20/pe.png' },
        { value: 'Argentina', label: 'Argentina', flag: 'https://flagcdn.com/w20/ar.png' },
        { value: 'Venezuela', label: 'Venezuela', flag: 'https://flagcdn.com/w20/ve.png' },
        { value: 'Brasil', label: 'Brasil', flag: 'https://flagcdn.com/w20/br.png' },
        { value: 'Chile', label: 'Chile', flag: 'https://flagcdn.com/w20/cl.png' },
        { value: 'Colombia', label: 'Colombia', flag: 'https://flagcdn.com/w20/co.png' },
        { value: 'Ecuador', label: 'Ecuador', flag: 'https://flagcdn.com/w20/ec.png' },
        { value: 'México', label: 'México', flag: 'https://flagcdn.com/w20/mx.png' },
        { value: 'Estados Unidos', label: 'Estados Unidos', flag: 'https://flagcdn.com/w20/us.png' },
        { value: 'España', label: 'España', flag: 'https://flagcdn.com/w20/es.png' },
        { value: 'Otro', label: 'Otro', flag: 'https://flagcdn.com/w20/un.png' }
    ];

    // Formatear opciones para mostrar banderas
    const formatOptionLabel = ({ value, label, flag }) => (
        <div className="flag-option">
            <img src={flag} alt={label} className="flag-icon" />
            <span>{label}</span>
        </div>
    );

    // Cargar departamentos de Perú
    const cargarDepartamentos = async () => {
        try {
            const response = await fetch('https://free.e-api.net.pe/ubigeos.json');
            const data = await response.json();
            const departamentosList = Object.keys(data).map(depto => ({
                value: depto,
                label: depto
            }));
            setDepartamentos(departamentosList);
        } catch (error) {
            console.error('Error al cargar los departamentos:', error);
        }
    };

    // Cargar provincias según departamento seleccionado
    const cargarProvincias = async (departamentoSelected) => {
        try {
            const response = await fetch('https://free.e-api.net.pe/ubigeos.json');
            const data = await response.json();
            const provinciasList = Object.keys(data[departamentoSelected]).map(prov => ({
                value: prov,
                label: prov
            }));
            setProvincias(provinciasList);
            setProvincia('');
            setDistrito('');
        } catch (error) {
            console.error('Error al cargar las provincias:', error);
        }
    };

    // Cargar distritos según provincia seleccionada
    const cargarDistritos = async (departamentoSelected, provinciaSelected) => {
        try {
            const response = await fetch('https://free.e-api.net.pe/ubigeos.json');
            const data = await response.json();
            const distritosList = Object.keys(data[departamentoSelected][provinciaSelected]).map(dist => ({
                value: dist,
                label: dist
            }));
            setDistritos(distritosList);
            setDistrito('');
        } catch (error) {
            console.error('Error al cargar los distritos:', error);
        }
    };

    // Manejar cambio de país
    const handlePaisChange = (selectedOption) => {
        const selectedPais = selectedOption ? selectedOption.value : '';
        setPais(selectedPais);
        setDepartamento('');
        setProvincia('');
        setDistrito('');
        setCiudadExtranjera('');

        if (selectedPais === 'Perú') {
            cargarDepartamentos();
        }
    };

    // Manejar cambio de departamento
    const handleDepartamentoChange = (selectedOption) => {
        const selectedDepto = selectedOption ? selectedOption.value : '';
        setDepartamento(selectedDepto);
        setProvincia('');
        setDistrito('');

        if (selectedDepto) {
            cargarProvincias(selectedDepto);
        }
    };

    // Manejar cambio de provincia
    const handleProvinciaChange = (selectedOption) => {
        const selectedProv = selectedOption ? selectedOption.value : '';
        setProvincia(selectedProv);
        setDistrito('');

        if (selectedProv && departamento) {
            cargarDistritos(departamento, selectedProv);
        }
    };

    // Manejar cambio de distrito
    const handleDistritoChange = (selectedOption) => {
        const selectedDist = selectedOption ? selectedOption.value : '';
        setDistrito(selectedDist);
    };

    // Manejar cambio de ciudad extranjera
    const handleCiudadExtranjeraChange = (e) => {
        setCiudadExtranjera(e.target.value);
    };

    // Efecto para emitir los cambios de ubicación
    useEffect(() => {
        if (onLocationChange) {
            const ubicacion = {
                pais,
                departamento: pais === 'Perú' ? departamento : null,
                provincia: pais === 'Perú' ? provincia : null,
                distrito: pais === 'Perú' ? distrito : null,
                ciudadExtranjera: pais !== 'Perú' && pais ? ciudadExtranjera : null
            };
            onLocationChange(ubicacion);
        }
    }, [pais, departamento, provincia, distrito, ciudadExtranjera, onLocationChange]);

    return (
        <div className="pb-4 w-full">
            {/* <h2>Filtro por ubicación</h2> */}

            <div className="form-group w-full">
                <label htmlFor="pais">País:</label>
                <Select
                    id="pais"
                    className=""
                    options={paises}
                    value={paises.find(op => op.value === pais) || null}
                    onChange={handlePaisChange}
                    formatOptionLabel={formatOptionLabel}
                    placeholder="Selecciona un país"
                    isClearable
                />
            </div>

            {pais === 'Perú' && (
                <div className="peru-container flex w-full gap-4">
                    <div className="form-group w-full">
                        <label htmlFor="departamento">Departamento:</label>
                        <Select
                            id="departamento"
                            className="w-full"
                            options={departamentos}
                            value={departamentos.find(op => op.value === departamento) || null}
                            onChange={handleDepartamentoChange}
                            placeholder="Selecciona un departamento"
                            isClearable
                            isDisabled={!pais}
                        />
                    </div>

                    <div className="form-group w-full">
                        <label htmlFor="provincia">Provincia:</label>
                        <Select
                            id="provincia"
                            className="w-full"
                            options={provincias}
                            value={provincias.find(op => op.value === provincia) || null}
                            onChange={handleProvinciaChange}
                            placeholder="Selecciona una provincia"
                            isClearable
                            isDisabled={!departamento}
                        />
                    </div>

                    <div className="form-group w-full">
                        <label htmlFor="distrito">Distrito:</label>
                        <Select
                            id="distrito"
                            className="w-full"
                            options={distritos}
                            value={distritos.find(op => op.value === distrito) || null}
                            onChange={handleDistritoChange}
                            placeholder="Selecciona un distrito"
                            isClearable
                            isDisabled={!provincia}
                        />
                    </div>
                </div>
            )}

            {pais && pais !== 'Perú' && (
                <div className="otro-pais-container">
                    <div className="form-group">
                        <label htmlFor="ciudad-extranjera">Ciudad/Localidad:</label>
                        <input
                            type="text"
                            id="ciudad-extranjera"
                            className="input-ciudad"
                            value={ciudadExtranjera}
                            onChange={handleCiudadExtranjeraChange}
                            placeholder="Ingresa la ciudad o localidad"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UbigeoSelector;