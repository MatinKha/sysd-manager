use serde::{Deserialize, Serialize};
use std::{collections::HashMap, process::Command, str::from_utf8};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemdUnit {
    pub unit: String,
    pub load: String,
    pub active: String,
    pub sub: String,
    pub description: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemdUnitShow {
    pub id: String,
    pub names: Vec<String>,
    pub description: String,

    pub load_state: String,
    pub active_state: String,
    pub sub_state: String,
    pub unit_file_state: String,

    pub fragment_path: String,
    pub source_path: String,

    pub requires: Vec<String>,
    pub wants: Vec<String>,
    pub conflicts: Vec<String>,
    pub before: Vec<String>,
    pub after: Vec<String>,

    pub service_type: String,
    pub exit_type: String,
    pub restart: String,
    pub remain_after_exit: bool,

    pub exec_start: String,
    pub exec_stop: Option<String>,
    pub exec_reload: Option<String>,
    pub user: String,
    pub group: String,
    pub working_directory: String,

    pub main_pid: u32,
    pub pids: Vec<u32>,

    pub memory_current: Option<u64>,
    pub memory_peak: Option<u64>,
    pub cpu_usage_nsec: Option<u64>,
    pub tasks_current: Option<u64>,

    pub memory_max: String,
    pub memory_high: String,
    pub tasks_max: u64,
    pub cpu_quota: String,

    pub state_change_timestamp: u64,
    pub active_enter_timestamp: u64,
    pub inactive_exit_timestamp: u64,

    pub condition_result: bool,
    pub assert_result: bool,
    pub status_text: String,
    pub result: String,

    pub n_restarts: u32,
    pub start_limit_burst: u32,

    pub slice: String,
    pub control_group: String,

    pub can_start: bool,
    pub can_stop: bool,
    pub can_reload: bool,
    pub can_isolate: bool,
    pub can_freeze: bool,

    pub no_new_privileges: bool,
    pub private_network: bool,
    pub private_tmp: bool,
    pub protect_system: String,
    pub protect_home: String,
    pub read_only_paths: Vec<String>,
    pub read_write_paths: Vec<String>,

    pub kill_mode: String,
    pub kill_signal: String,
    pub send_sigkill: bool,

    pub timeout_start_usec: String,
    pub timeout_stop_usec: String,

    pub documentation: Vec<String>,

    pub environment: Vec<String>,
    pub environment_files: Vec<String>,
}

#[tauri::command]
pub fn get_unit_full_info(unit_name: String) -> Result<SystemdUnitShow, String> {
    let unit_name = normalize_unit_name(&unit_name);

    let output = Command::new("systemctl")
        .args(["show", &unit_name])
        .output()
        .map_err(|e| format!("Failed to execute systemctl: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "Unit not found: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    let props = parse_show_output(&output.stdout);
    Ok(parse_systemd_unit(&props, &unit_name))
}

fn normalize_unit_name(name: &str) -> String {
    if name.ends_with(".service")
        || name.ends_with(".socket")
        || name.ends_with(".timer")
        || name.ends_with(".mount")
        || name.ends_with(".target")
        || name.ends_with(".device")
    {
        name.to_string()
    } else {
        format!("{}.service", name)
    }
}

fn parse_show_output(output: &[u8]) -> HashMap<String, String> {
    let text = String::from_utf8_lossy(output);
    let mut props = HashMap::new();

    for line in text.lines() {
        if let Some((key, value)) = line.split_once('=') {
            props.insert(key.to_string(), value.to_string());
        }
    }

    props
}

fn parse_systemd_unit(props: &HashMap<String, String>, unit_name: &str) -> SystemdUnitShow {
    SystemdUnitShow {
        id: props
            .get("Id")
            .cloned()
            .unwrap_or_else(|| unit_name.to_string()),
        names: parse_list_prop(props, "Names"),
        description: props.get("Description").cloned().unwrap_or_default(),

        load_state: props.get("LoadState").cloned().unwrap_or_default(),
        active_state: props.get("ActiveState").cloned().unwrap_or_default(),
        sub_state: props.get("SubState").cloned().unwrap_or_default(),
        unit_file_state: props.get("UnitFileState").cloned().unwrap_or_default(),

        fragment_path: props.get("FragmentPath").cloned().unwrap_or_default(),
        source_path: props.get("SourcePath").cloned().unwrap_or_default(),

        requires: parse_list_prop(props, "Requires"),
        wants: parse_list_prop(props, "Wants"),
        conflicts: parse_list_prop(props, "Conflicts"),
        before: parse_list_prop(props, "Before"),
        after: parse_list_prop(props, "After"),

        service_type: props.get("Type").cloned().unwrap_or_default(),
        exit_type: props.get("ExitType").cloned().unwrap_or_default(),
        restart: props.get("Restart").cloned().unwrap_or_default(),
        remain_after_exit: parse_bool_prop(props, "RemainAfterExit"),

        exec_start: parse_exec_command(props, "ExecStart"),
        exec_stop: parse_exec_command_optional(props, "ExecStop"),
        exec_reload: parse_exec_command_optional(props, "ExecReload"),
        user: props.get("User").cloned().unwrap_or_default(),
        group: props.get("GID").cloned().unwrap_or_default(),
        working_directory: props.get("WorkingDirectory").cloned().unwrap_or_default(),

        main_pid: parse_u32_prop(props, "MainPID"),
        pids: parse_list_prop(props, "PIDs")
            .iter()
            .filter_map(|v| v.parse().ok())
            .collect(),

        memory_current: parse_optional_u64(props, "MemoryCurrent"),
        memory_peak: parse_optional_u64(props, "MemoryPeak"),
        cpu_usage_nsec: parse_optional_u64(props, "CPUUsageNSec"),
        tasks_current: parse_optional_u64(props, "TasksCurrent"),

        memory_max: props.get("MemoryMax").cloned().unwrap_or_default(),
        memory_high: props.get("MemoryHigh").cloned().unwrap_or_default(),
        tasks_max: parse_u64_prop(props, "TasksMax"),
        cpu_quota: props.get("CPUQuotaPerSecUSec").cloned().unwrap_or_default(),

        state_change_timestamp: parse_u64_prop(props, "StateChangeTimestampMonotonic"),
        active_enter_timestamp: parse_u64_prop(props, "ActiveEnterTimestampMonotonic"),
        inactive_exit_timestamp: parse_u64_prop(props, "InactiveExitTimestampMonotonic"),

        condition_result: parse_bool_prop(props, "ConditionResult"),
        assert_result: parse_bool_prop(props, "AssertResult"),
        status_text: props.get("StatusText").cloned().unwrap_or_default(),
        result: props.get("Result").cloned().unwrap_or_default(),

        n_restarts: parse_u32_prop(props, "NRestarts"),
        start_limit_burst: parse_u32_prop(props, "StartLimitBurst"),

        slice: props.get("Slice").cloned().unwrap_or_default(),
        control_group: props.get("ControlGroup").cloned().unwrap_or_default(),

        can_start: parse_yes_no_prop(props, "CanStart"),
        can_stop: parse_yes_no_prop(props, "CanStop"),
        can_reload: parse_yes_no_prop(props, "CanReload"),
        can_isolate: parse_yes_no_prop(props, "CanIsolate"),
        can_freeze: parse_yes_no_prop(props, "CanFreeze"),

        no_new_privileges: parse_bool_prop(props, "NoNewPrivileges"),
        private_network: parse_bool_prop(props, "PrivateNetwork"),
        private_tmp: parse_bool_prop(props, "PrivateTmp"),
        protect_system: props.get("ProtectSystem").cloned().unwrap_or_default(),
        protect_home: props.get("ProtectHome").cloned().unwrap_or_default(),
        read_only_paths: parse_list_prop(props, "ReadOnlyPaths"),
        read_write_paths: parse_list_prop(props, "ReadWritePaths"),

        kill_mode: props.get("KillMode").cloned().unwrap_or_default(),
        kill_signal: props.get("KillSignal").cloned().unwrap_or_default(),
        send_sigkill: parse_yes_no_prop(props, "SendSIGKILL"),

        timeout_start_usec: props.get("TimeoutStartUSec").cloned().unwrap_or_default(),
        timeout_stop_usec: props.get("TimeoutStopUSec").cloned().unwrap_or_default(),

        documentation: parse_multiline_prop(props, "Documentation"),

        environment: parse_multiline_prop(props, "Environment"),
        environment_files: parse_list_prop(props, "EnvironmentFiles"),
    }
}

fn parse_list_prop(props: &HashMap<String, String>, key: &str) -> Vec<String> {
    props
        .get(key)
        .map(|v| {
            v.split_whitespace()
                .map(String::from)
                .filter(|s| !s.is_empty())
                .collect()
        })
        .unwrap_or_default()
}

fn parse_multiline_prop(props: &HashMap<String, String>, key: &str) -> Vec<String> {
    props
        .get(key)
        .map(|v| {
            v.lines()
                .map(String::from)
                .filter(|s| !s.is_empty())
                .collect()
        })
        .unwrap_or_default()
}

fn parse_bool_prop(props: &HashMap<String, String>, key: &str) -> bool {
    props
        .get(key)
        .map(|v| v == "yes" || v == "true")
        .unwrap_or(false)
}

fn parse_yes_no_prop(props: &HashMap<String, String>, key: &str) -> bool {
    props.get(key).map(|v| v == "yes").unwrap_or(false)
}

fn parse_u32_prop(props: &HashMap<String, String>, key: &str) -> u32 {
    props.get(key).and_then(|v| v.parse().ok()).unwrap_or(0)
}

fn parse_u64_prop(props: &HashMap<String, String>, key: &str) -> u64 {
    props.get(key).and_then(|v| v.parse().ok()).unwrap_or(0)
}

fn parse_optional_u64(props: &HashMap<String, String>, key: &str) -> Option<u64> {
    props.get(key).and_then(|v| {
        if v == "[not set]" || v.is_empty() {
            None
        } else {
            v.parse().ok()
        }
    })
}

fn parse_exec_command(props: &HashMap<String, String>, key: &str) -> String {
    props
        .get(key)
        .and_then(|v| {
            // Parse: { path=/usr/bin/sshd ; argv[]=/usr/bin/sshd -D ; ... }
            v.split(';')
                .find(|part| part.trim().starts_with("argv[]="))
                .map(|argv| argv.trim().trim_start_matches("argv[]=").to_string())
        })
        .unwrap_or_default()
}

fn parse_exec_command_optional(props: &HashMap<String, String>, key: &str) -> Option<String> {
    let result = parse_exec_command(props, key);
    if result.is_empty() {
        None
    } else {
        Some(result)
    }
}

#[tauri::command]
pub fn list_units() -> Result<Vec<SystemdUnit>, String> {
    let output = Command::new("systemctl")
        .args([
            "list-units",
            "--all",
            "--type=service",
            "--no-legend",
            "--no-pager",
            "--output=json",
        ])
        .output()
        .map_err(|e| format!("Failed to execute systemctl: {}", e))?;

    if !output.status.success() {
        return list_units_text_fallback();
    }

    let units: Vec<SystemdUnit> = serde_json::from_slice(&output.stdout)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    Ok(units)
}

fn list_units_text_fallback() -> Result<Vec<SystemdUnit>, String> {
    let output = Command::new("systemctl")
        .args([
            "list-units",
            "--all",
            "--type=service",
            "--no-legend",
            "--no-pager",
        ])
        .output()
        .map_err(|e| format!("Failed to execute systemctl: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut units = Vec::new();

    for line in stdout.lines() {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 5 {
            units.push(SystemdUnit {
                unit: parts[0].to_string(),
                load: parts[1].to_string(),
                active: parts[2].to_string(),
                sub: parts[3].to_string(),
                description: parts[4..].join(" "),
            });
        }
    }

    Ok(units)
}
