import Database from "@tauri-apps/plugin-sql";
import { waitForLocalDbIdle } from "../logic/sync/localDbOperationGate";

let rawDbInstance: Database | null = null;
let safeDbInstance: Database | null = null;

const initDb = async () => {
  if (!rawDbInstance) {
    rawDbInstance = await Database.load("sqlite:valeska.db");
  }
  return rawDbInstance;
};

/**
 * Retorna la conexión a la base de datos local para operaciones seguras desde la UI.
 * Si hay una operación masiva activa (Importación, Sincronización), esta función
 * pausará las consultas hasta que la operación masiva termine, evitando bloqueos
 * de SQLite (database is locked).
 */
export const getDb = async (): Promise<Database> => {
  const db = await initDb();
  
  if (!safeDbInstance) {
    safeDbInstance = new Proxy(db, {
      get(target, prop, receiver) {
        const originalMethod = Reflect.get(target, prop, receiver);
        
        // Interceptamos solo execute para forzar la espera de escrituras si la compuerta está cerrada.
        // Los select (lecturas) pasan de largo porque SQLite WAL permite lectura concurrente.
        if (prop === "execute") {
          return async (...args: any[]) => {
            await waitForLocalDbIdle();
            // @ts-ignore
            return originalMethod.apply(target, args);
          };
        }
        
        return originalMethod;
      }
    });
  }
  
  return safeDbInstance;
};

/**
 * Retorna la conexión pura sin compuertas. 
 * SOLO DEBE SER USADA por procesos que ya hayan adquirido el bloqueo
 * mediante runExclusiveLocalDbOperation (ej. Importador Excel, Sincronización).
 */
export const getUnsafeDb = async (): Promise<Database> => {
  return initDb();
};
