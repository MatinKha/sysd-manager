
export interface SystemdUnit {
  unit: string,
  load: string,
  active: string,
  sub: string,
  description: string,
}


export interface SystemdUnitShow {
  id: string;
  names: string[];
  description: string;

  load_state: string;
  active_state: string;
  sub_state: string;
  unit_file_state: string;

  fragment_path: string;
  source_path: string;

  requires: string[];
  wants: string[];
  conflicts: string[];
  before: string[];
  after: string[];

  service_type: string;
  exit_type: string;
  restart: string;
  remain_after_exit: boolean;

  exec_start: string;
  exec_stop: string | null;
  exec_reload: string | null;
  user: string;
  group: string;
  working_directory: string;

  main_pid: number;
  pids: number[];

  memory_current: number | null;
  memory_peak: number | null;
  cpu_usage_nsec: number | null;
  tasks_current: number | null;

  memory_max: string;
  memory_high: string;
  tasks_max: number;
  cpu_quota: string;

  state_change_timestamp: number;
  active_enter_timestamp: number;
  inactive_exit_timestamp: number;

  condition_result: boolean;
  assert_result: boolean;
  status_text: string;
  result: string;

  n_restarts: number;
  start_limit_burst: number;

  slice: string;
  control_group: string;

  can_start: boolean;
  can_stop: boolean;
  can_reload: boolean;
  can_isolate: boolean;
  can_freeze: boolean;

  no_new_privileges: boolean;
  private_network: boolean;
  private_tmp: boolean;
  protect_system: string;
  protect_home: string;
  read_only_paths: string[];
  read_write_paths: string[];

  kill_mode: string;
  kill_signal: string;
  send_sigkill: boolean;

  timeout_start_usec: string;
  timeout_stop_usec: string;

  documentation: string[];

  environment: string[];
  environment_files: string[];
}
