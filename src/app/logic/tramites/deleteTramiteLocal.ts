export async function softDeleteTramiteLocally(db: any, id: string, now = Date.now()) {
  await db.execute(
    "UPDATE tramites SET deleted_at=$1, updated_at=$1, sync_status='LOCAL_UPDATE' WHERE id=$2",
    [now, id],
  );
  await db.execute(
    "UPDATE tramite_detalles SET deleted_at=$1, updated_at=$1, sync_status='LOCAL_UPDATE' WHERE tramite_id=$2",
    [now, id],
  );
}
