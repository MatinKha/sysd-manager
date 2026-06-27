import React, { useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Descriptions,
  Card,
  Tag,
  Spin,
  Result,
  Empty,
  Typography,
  Space,
  Badge,
  Collapse,
  List,
  Button,
} from 'antd';
import {
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SettingOutlined,
  SafetyOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { UnitsContext } from './UnitSplit';
import { invoke } from '@tauri-apps/api/core';
import { SystemdUnitShow } from '../models/systemd';


const { Text, Title } = Typography;

const statusColorMap: Record<string, string> = {
  active: 'green',
  inactive: 'default',
  failed: 'red',
  activating: 'orange',
  deactivating: 'orange',
  reloading: 'blue',
};

const loadStateColorMap: Record<string, string> = {
  loaded: 'green',
  loading: 'orange',
  error: 'red',
  'not-found': 'red',
  stub: 'purple',
  merged: 'blue',
  masked: 'red',
};

export default function UnitDescription() {
  const unitContext = useContext(UnitsContext);
  const selectedUnit = unitContext?.selectedUnit;

  const {
    isPending,
    error,
    data,
    refetch,
  } = useQuery({
    queryKey: ['unitInfo', selectedUnit?.unit],
    queryFn: () =>
      invoke<SystemdUnitShow>('getUnitDetailedInfo', {
        unit: selectedUnit?.unit,
      }),
    enabled: !!selectedUnit?.unit,
    staleTime: 5000,
    retry: 2,
  });

  if (!selectedUnit) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          minHeight: 400,
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Space direction="vertical" size="small">
              <Text strong>no Service Selected</Text>
              <Text type="secondary">
                select a service
              </Text>
            </Space>
          }
        />
      </div>
    );
  }

  if (isPending) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          minHeight: 400,
        }}
      >
        <Spin size="large" tip="Loading unit information...">
          <div style={{ padding: 50 }} />
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="Failed to Load Unit Information"
        subTitle={error.message}
        extra={[
          <Button key="retry" type="primary" onClick={() => refetch()}>
            Retry
          </Button>,
        ]}
      />
    );
  }

  if (!data) {

    return (
      <Result
        status="warning"
        title="No Information Available"
        subTitle={`Could not retrieve information for ${selectedUnit.unit}`}
        extra={
          <Button onClick={() => refetch()}>Refresh</Button>
        }
      />
    );
  }

  return (
    <div style={{ padding: '16px', overflow: 'auto', height: '100%' }}>
      {/* header card */}
      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <Badge
              status={
                data.active_state === 'active'
                  ? 'success'
                  : data.active_state === 'failed'
                    ? 'error'
                    : 'default'
              }
              size='medium'
              text={
                <Title level={3} style={{ margin: 0, display: "inline" }}>
                  {data.names?.[0] || data.id}
                </Title>
              }
            />
            <Tag color={statusColorMap[data.active_state] || 'default'}>
              {data.active_state}
            </Tag>
            <Tag color={loadStateColorMap[data.load_state] || 'default'}>
              {data.load_state}
            </Tag>
          </Space>
          <Text type="secondary">{data.description}</Text>
        </Space>
      </Card>

      {/* basic info */}
      <Card
        title={
          <Space>
            <InfoCircleOutlined />
            <span>Basic Information</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="ID">{data.id}</Descriptions.Item>
          <Descriptions.Item label="Names">
            {data.names?.join(', ') || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            {data.description || 'No description'}
          </Descriptions.Item>
          <Descriptions.Item label="Load State">
            <Tag color={loadStateColorMap[data.load_state]}>
              {data.load_state}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Active State">
            <Tag color={statusColorMap[data.active_state]}>
              {data.active_state}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Sub State">
            {data.sub_state}
          </Descriptions.Item>
          <Descriptions.Item label="Unit File State">
            <Tag
              color={
                data.unit_file_state === 'enabled'
                  ? 'green'
                  : data.unit_file_state === 'disabled'
                    ? 'default'
                    : 'red'
              }
            >
              {data.unit_file_state}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Fragment Path">
            <Text code>{data.fragment_path || 'N/A'}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* execution information */}
      <Card
        title={
          <Space>
            <SettingOutlined />
            <span>Execution</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Service Type">
            <Tag color="blue">{data.service_type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Restart Policy">
            <Tag color="purple">{data.restart}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="ExecStart">
            <Text code style={{ wordBreak: 'break-all' }}>
              {data.exec_start || 'N/A'}
            </Text>
          </Descriptions.Item>
          {data.exec_stop && (
            <Descriptions.Item label="ExecStop">
              <Text code style={{ wordBreak: 'break-all' }}>
                {data.exec_stop}
              </Text>
            </Descriptions.Item>
          )}
          {data.exec_reload && (
            <Descriptions.Item label="ExecReload">
              <Text code style={{ wordBreak: 'break-all' }}>
                {data.exec_reload}
              </Text>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="User">{data.user || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Group">
            {data.group || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Working Directory">
            <Text code>{data.working_directory || 'N/A'}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* process info */}
      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>Process Information</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Main PID">
            {data.main_pid || 'Not running'}
          </Descriptions.Item>
          <Descriptions.Item label="PIDs">
            {data.pids?.length > 0 ? data.pids.join(', ') : 'None'}
          </Descriptions.Item>
          <Descriptions.Item label="Memory Current">
            {data.memory_current != null
              ? formatBytes(data.memory_current)
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Memory Peak">
            {data.memory_peak != null
              ? formatBytes(data.memory_peak)
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="CPU Usage">
            {data.cpu_usage_nsec != null
              ? formatNanoSeconds(data.cpu_usage_nsec)
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Tasks Current">
            {data.tasks_current ?? 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Tasks Max">
            {data.tasks_max || 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* limits */}
      <Card
        title="Resource Limits"
        style={{ marginBottom: 16 }}
        size="small"
      >
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Memory Max">
            {data.memory_max}
          </Descriptions.Item>
          <Descriptions.Item label="Memory High">
            {data.memory_high}
          </Descriptions.Item>
          <Descriptions.Item label="CPU Quota">
            {data.cpu_quota}
          </Descriptions.Item>
          <Descriptions.Item label="Slice">
            {data.slice || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Control Group">
            <Text code>{data.control_group || 'N/A'}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* deps */}
      <Collapse
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'dependencies',
            label: (
              <Space>
                <InfoCircleOutlined />
                <span>Dependencies</span>
              </Space>
            ),
            children: (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Requires">
                  {data.requires?.length > 0 ? (
                    <Space wrap>
                      {data.requires.map((dep: any) => (
                        <Tag key={dep} color="blue">
                          {dep}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    'None'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Wants">
                  {data.wants?.length > 0 ? (
                    <Space wrap>
                      {data.wants.map((dep: any) => (
                        <Tag key={dep} color="cyan">
                          {dep}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    'None'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Conflicts">
                  {data.conflicts?.length > 0 ? (
                    <Space wrap>
                      {data.conflicts.map((dep: any) => (
                        <Tag key={dep} color="red">
                          {dep}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    'None'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Before">
                  {data.before?.length > 0 ? (
                    <Space wrap>
                      {data.before.map((dep: any) => (
                        <Tag key={dep} color="green">
                          {dep}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    'None'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="After">
                  {data.after?.length > 0 ? (
                    <Space wrap>
                      {data.after.map((dep: any) => (
                        <Tag key={dep} color="orange">
                          {dep}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    'None'
                  )}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
        ]}
      />

      {/* security */}
      <Collapse
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'security',
            label: (
              <Space>
                <SafetyOutlined />
                <span>Security</span>
              </Space>
            ),
            children: (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="No New Privileges">
                  <Tag color={data.no_new_privileges ? 'green' : 'red'}>
                    {data.no_new_privileges ? 'Enabled' : 'Disabled'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Private Network">
                  <Tag color={data.private_network ? 'green' : 'red'}>
                    {data.private_network ? 'Yes' : 'No'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Private Tmp">
                  <Tag color={data.private_tmp ? 'green' : 'red'}>
                    {data.private_tmp ? 'Yes' : 'No'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Protect System">
                  {data.protect_system || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Protect Home">
                  {data.protect_home || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Kill Mode">
                  {data.kill_mode || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Kill Signal">
                  {data.kill_signal || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Send SIGKILL">
                  <Tag color={data.send_sigkill ? 'green' : 'red'}>
                    {data.send_sigkill ? 'Yes' : 'No'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Read Only Paths">
                  {data.read_only_paths?.length > 0
                    ? data.read_only_paths.join(', ')
                    : 'None'}
                </Descriptions.Item>
                <Descriptions.Item label="Read Write Paths">
                  {data.read_write_paths?.length > 0
                    ? data.read_write_paths.join(', ')
                    : 'None'}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
        ]}
      />

      {/* timestamps */}
      <Collapse
        style={{ marginBottom: 16 }}
        items={[
          {
            key: 'timestamps',
            label: (
              <Space>
                <ClockCircleOutlined />
                <span>Timestamps & Additional Info</span>
              </Space>
            ),
            children: (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="State Change">
                  {formatTimestamp(data.state_change_timestamp)}
                </Descriptions.Item>
                <Descriptions.Item label="Active Enter">
                  {formatTimestamp(data.active_enter_timestamp)}
                </Descriptions.Item>
                <Descriptions.Item label="Inactive Exit">
                  {formatTimestamp(data.inactive_exit_timestamp)}
                </Descriptions.Item>
                <Descriptions.Item label="N Restarts">
                  {data.n_restarts}
                </Descriptions.Item>
                <Descriptions.Item label="Start Limit Burst">
                  {data.start_limit_burst}
                </Descriptions.Item>
                <Descriptions.Item label="Condition Result">
                  <Tag color={data.condition_result ? 'green' : 'red'}>
                    {data.condition_result ? 'Passed' : 'Failed'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Assert Result">
                  <Tag color={data.assert_result ? 'green' : 'red'}>
                    {data.assert_result ? 'Passed' : 'Failed'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Result">
                  {data.result}
                </Descriptions.Item>
                <Descriptions.Item label="Status Text">
                  {data.status_text || 'None'}
                </Descriptions.Item>
                <Descriptions.Item label="Timeout Start">
                  {data.timeout_start_usec}
                </Descriptions.Item>
                <Descriptions.Item label="Timeout Stop">
                  {data.timeout_stop_usec}
                </Descriptions.Item>
              </Descriptions>
            ),
          },
        ]}
      />

      {/* env and doc */}
      {(data.environment?.length > 0 || data.documentation?.length > 0) && (
        <Collapse
          style={{ marginBottom: 16 }}
          items={[
            {
              key: 'env-docs',
              label: 'Environment & Documentation',
              children: (
                <>
                  {data.environment?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>Environment Variables:</Text>
                      <List
                        size="small"
                        dataSource={data.environment}
                        renderItem={(env: any) => (
                          <List.Item>
                            <Text code>{env}</Text>
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                  {data.documentation?.length > 0 && (
                    <div>
                      <Text strong>Documentation:</Text>
                      <List
                        size="small"
                        dataSource={data.documentation}
                        renderItem={(doc: any) => (
                          <List.Item>
                            <Text>{doc}</Text>
                          </List.Item>
                        )}
                      />
                    </div>
                  )}
                </>
              ),
            },
          ]}
        />
      )}

      {/* actions */}
      <Card size="small">
        <Space wrap>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            disabled={!data.can_start || data.active_state === 'active'}
            onClick={() => {
              invoke('start_unit', { unitName: data.id });
              setTimeout(() => refetch(), 1000);
            }}
          >
            Start
          </Button>
          <Button
            danger
            icon={<StopOutlined />}
            disabled={!data.can_stop || data.active_state !== 'active'}
            onClick={() => {
              invoke('stop_unit', { unitName: data.id });
              setTimeout(() => refetch(), 1000);
            }}
          >
            Stop
          </Button>
          <Button
            icon={<ReloadOutlined />}
            disabled={!data.can_reload || data.active_state !== 'active'}
            onClick={() => {
              invoke('restart_unit', { unitName: data.id });
              setTimeout(() => refetch(), 1000);
            }}
          >
            Restart
          </Button>
        </Space>
      </Card>
    </div>
  );
}

/* HELPER */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatNanoSeconds(ns: number): string {
  if (ns < 1000) return `${ns} ns`;
  if (ns < 1000000) return `${(ns / 1000).toFixed(2)} µs`;
  if (ns < 1000000000) return `${(ns / 1000000).toFixed(2)} ms`;
  return `${(ns / 1000000000).toFixed(2)} s`;
}

function formatTimestamp(timestamp: number): string {
  if (timestamp === 0) return 'N/A';
  const seconds = timestamp / 1000000;
  const date = new Date(Date.now() - (Date.now() % (1000 * 60 * 60 * 24)) + seconds * 1000);
  return `${seconds.toFixed(2)}s (${date.toLocaleTimeString()})`;
}
