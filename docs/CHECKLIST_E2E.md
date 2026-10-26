# Checklist E2E por rol (N-03 / SCRUM-57)

Marcar ✅ / ❌ y anotar el bug en Jira (tipo Bug, enlazado a SCRUM-57).

## Admin / Soporte (Web)
- [ ] Login con credenciales válidas e inválidas
- [ ] Parametrización: editar un parámetro y verificar que se refleja (≤4 s)
- [ ] Auditoría: se registra el cambio con diff
- [ ] PQRS / disputas: abrir, responder y cerrar un ticket
- [ ] Override de PIN con justificación
- [ ] Cierre de sesión y acceso a ruta protegida sin token

## Proveedor (Web)
- [ ] Crear, editar y eliminar producto
- [ ] Ver pedidos y cambiar estado
- [ ] Crear despacho, asignar camión y repartidor
- [ ] Liquidaciones: la comisión mostrada es 3.5 %
- [ ] Gestión de tiendas clientes

## Tendero (App)
- [ ] Login (sin accesos demo en release)
- [ ] Ver catálogo por proveedor
- [ ] Crear pedido y "repetir último"
- [ ] Ver "Mis pedidos" y confirmar entrega con PIN
- [ ] Sin red: mensaje de error claro, sin cierre inesperado

## Repartidor (App)
- [ ] Ver manifiesto de carga y ruta
- [ ] Actualizar progreso de entregas / reportar varado
- [ ] GPS visible en el mapa OSM del proveedor

## Transversal
- [ ] Un usuario no ve datos de otro proveedor/tienda (HU-20)
- [ ] Token expirado → vuelve al login sin romper la UI
