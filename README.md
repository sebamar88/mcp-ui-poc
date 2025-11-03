# MCP UI PoC con React + Vite

PoC que muestra cómo integrar el SDK `@mcp-ui/client` en una aplicación React construida con Vite y TypeScript. Los datos provienen de [JSONPlaceholder](https://jsonplaceholder.typicode.com/) y se organizan en capas (`api`, `services`, `hooks`, `components`, `pages`, `types`, `utils`) para mantener responsabilidades bien definidas.

## Características principales

- 🎯 Renderizado de recursos MCP-UI con `<UIResourceRenderer />` mostrando contenido HTML interactivo.
- 🧱 Arquitectura modular por capas para separar acceso a datos, lógica de dominio y UI.
- 🔁 Gestión de datos con React Query y un `HttpClient` propio basado en `fetch` con control de errores.
- 📊 Bitácora de acciones que registra las notificaciones/intenciones emitidas por el recurso MCP-UI.
- ✅ Tests unitarios e integrados adicionales para servicios, hooks y componentes MCP.
- 🌐 Endpoint MCP (`/api/mcp`) listo para funciones serverless (ej. Vercel), compatible con `mode=html|remote`.

## Scripts disponibles

```bash
npm install      # Instala dependencias
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Genera build de producción
npm run preview  # Vista previa del build
npm run test     # Ejecuta la suite de tests (unitarios + integración)

## Endpoint MCP (Serverless)

El repositorio incluye `api/mcp.ts`, una función Node que reutiliza la lógica de servicios para construir
recursos MCP-UI. Con ella puedes desplegar la PoC en plataformas como Vercel:

1. Construye el frontend (`npm run build`). El resultado quedará en `dist/`.
2. Vercel detectará automáticamente `/api/mcp.ts` y expondrá `https://tu-app.vercel.app/api/mcp?postId=1`.
   Añade `mode=remote` para obtener la variante `remote-dom`.
3. Si deseas consumir este endpoint desde el frontend, configura `VITE_MCP_ENDPOINT` apuntando a tu
   dominio y úsalo en tu capa de datos.
```

## Estructura de carpetas

```
src/
├── api/                  # Adaptadores HTTP contra servicios externos
├── components/           # Componentes de UI reutilizables
├── hooks/                # Hooks específicos de la aplicación
├── pages/                # Vistas de alto nivel
├── services/             # Lógica de dominio y orquestación de datos
├── types/                # Definiciones de tipos compartidos
└── utils/                # Utilidades y helpers puros
```

## Próximos pasos sugeridos

- Añadir tests unitarios/integrados para servicios y hooks.
- Ampliar la demo con recursos `remote-dom` del SDK de MCP-UI.
- Conectar un servidor MCP real que emita recursos dinámicos.
