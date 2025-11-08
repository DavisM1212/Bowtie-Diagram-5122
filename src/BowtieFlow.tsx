import React, { useRef, useState } from "react";
import type { ReactFlowInstance } from "reactflow";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  applyNodeChanges, 
  type NodeChange,
  Position,
  type Edge,
  type Node,
  type NodeTypes,
} from "reactflow";
import "reactflow/dist/style.css";

/**
 * Bowtie diagram in ReactFlow
 */

// Types
export interface BarrierAssure {
  id: string;
  title: string;
  type?: string;
}

export interface Barrier {
  id: string;
  title: string;
  type?: string;
  owner?: string;
  assures?: BarrierAssure[];
}

export interface Threat {
  id: string;
  title: string;
  barriers: Barrier[];
}

export interface Consequence {
  id: string;
  title: string;
  barriers: Barrier[];
}

export interface BowtieData {
  hazard: string;
  topEvent: string;
  threats: Threat[];
  consequences: Consequence[];
}

type NodeKind = 'barrier' | 'threat' | 'consequence';

// Node data payloads for our custom nodes
interface BoxNodeData {
  title: string;
  headerColor?: string;
  chips?: string[];
  side?: "left" | "right";
  onToggle?: () => void;
  kind?: NodeKind;
}

interface TopEventData { title: string }
interface SignData { title: string; onToggle?: () => void }

// Small chip renderer
const CHIP: React.FC<{ label: string }> = ({ label }) => (
  <span
    style={{
      fontSize: 10,
      padding: "2px 6px",
      borderRadius: 6,
      background: "#f3f4f6",
      border: "1px solid #e5e7eb",
      marginRight: 4,
      whiteSpace: "nowrap",
    }}
    className="chip"
  >
    {label}
  </span>
);

const colorForType = (t?: string): string => {
  switch ((t || "").toLowerCase()) {
    case "active human":
      return "#ef4444"; // red-500
    case "active hardware":
      return "#22c55e"; // green-500
    case "passive hardware":
      return "#3b82f6"; // blue-500
    default:
      return "#94a3b8"; // slate-400
  }
};

// Generic bowtie node with a colored header
const BoxNode: React.FC<{ data: BoxNodeData }> = ({ data }) => {
  const { title, headerColor, chips = [], side, kind = 'barrier' } = data;

  const isBarrier = kind === 'barrier';
  const isThreat = kind === 'threat';
  const isConsequence = kind === 'consequence';

  const bg = isThreat ? '#2563eb' : isConsequence ? '#dc2626' : '#fff'; // blue / red / white
  const border = isBarrier ? '#e5e7eb' : bg;
  const textAlign =
    side === 'left' ? 'left' : side === 'right' ? 'left' : 'center';

  return (
    <div
      onClick={() => data.onToggle?.()}
      style={{
        width: 240,
        cursor: 'pointer',
        borderRadius: 12,
        boxShadow: '0 1px 6px rgba(0,0,0,.08)',
        border: `1px solid ${border}`,
        overflow: 'hidden',
        background: bg,
        textAlign,
      }}
    >
      {/* Barriers keep a thin header line; others are fully colored with a white content card */}
      {isBarrier && (
        <div style={{ height: 8, background: headerColor || '#475569' }} />
      )}

      <div
        style={{
          padding: 12,
          background: isBarrier ? '#fff' : '#fff', // always white content for readability
          margin: isBarrier ? 0 : 6,               // slight inset for threat/cons cards
          borderRadius: isBarrier ? 0 : 10,
        }}
      >
        <div style={{ fontWeight: 600, lineHeight: 1.2 }}>{title}</div>
        {chips.length ? (
          <div
            style={{
              marginTop: 8,
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {chips.map((c, i) => (
              <CHIP key={i} label={c} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Handles:
          - Barriers: both sides (chain links)
          - Threats: only source on the RIGHT
          - Consequences: only target on the LEFT */}
      {isBarrier && (
        <>
          <Handle type="target" position={Position.Left} />
          <Handle type="source" position={Position.Right} />
        </>
      )}
      {isThreat && <Handle type="source" position={Position.Right} />}
      {isConsequence && <Handle type="target" position={Position.Left} />}
    </div>
  );
};

// Center/top-event node 
const TopEventNode: React.FC<{ data: TopEventData }> = ({ data }) => (
  <div
    style={{
      width: 180,
      height: 180,
      borderRadius: 9999,
      boxShadow: "0 1px 6px rgba(0,0,0,.12)",
      border: "1px solid #e5e7eb",
      background: "linear-gradient(#fb923c, #ef4444)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        borderRadius: 6,
        background: "rgba(255,255,255,.92)",
        padding: "8px 12px",
        textAlign: "center",
        fontSize: 13,
        fontWeight: 600,
        lineHeight: 1.15,
      }}
    >
      {data.title}
    </div>
    <Handle id="top"  type="target" position={Position.Top} />
    <Handle id="left" type="target" position={Position.Left} />
    <Handle id="right" type="source" position={Position.Right} />
  </div>
);

const SignNode: React.FC<{ data: SignData }> = ({ data }) => (
  <div style={{ width: 260, cursor: 'pointer', borderRadius: 10, border: "1px solid #e5e7eb", background: "#fffbeb", boxShadow: "0 1px 6px rgba(0,0,0,.06)" }}>
    <div
      style={{ background: "#111827", color: "#fde68a", fontSize: 12, padding: "4px 8px", fontWeight: 700, letterSpacing: 0.5 }}>
      HAZARD
    </div>
    <div style={{ padding: 12, textAlign: "center", fontWeight: 600 }}>{data.title}</div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

// Bowtie data
const DATA: BowtieData = {
  hazard: "Driving a commercial vehicle on a highway",
  topEvent: "Loss of control over the vehicle at 70 mph",
  threats: [
    {
      id: "t_intox",
      title: "Intoxicated driving",
      barriers: [
        {
          id: "b_selfreport",
          title: "Driver reports unwell/impaired; supervisor assigns replacement",
          type: "Active Human",
          owner: "Supervisor",
          assures: [
            { id: "a_policy", title: "Company policy & training (FIT for duty)", type: "Admin" },
          ],
        },
        {
          id: "b_interlock",
          title: "Ignition interlock prevents starting the engine",
          type: "Active hardware",
          owner: "Engineering Manager",
        },
        {
          id: "b_detect",
          title: "Dispatcher/supervisor detects impairment and assigns replacement",
          type: "Active Human",
          owner: "Operations Manager",
        },
      ],
    },
    {
      id: "t_distract",
      title: "Distractive driving",
      barriers: [
        {
          id: "b_voice",
          title: "Voice-activated dispatch reduces manual input while driving",
          type: "Active hardware",
          owner: "Engineering Manager",
        },
        {
          id: "b_ldw",
          title: "Lane departure warning alerts; driver corrects and prevents drift",
          type: "Active hardware + Human",
          owner: "Supervisor",
        },
      ],
    },
    {
      id: "t_slippery",
      title: "Driving on slippery road",
      barriers: [
        {
          id: "b_weather",
          title: "Driver checks weather and adjusts schedule to avoid rain",
          type: "Active Human",
          owner: "Supervisor",
        },
        {
          id: "b_abs",
          title: "Anti‑lock braking system (ABS) maintains steering control",
          type: "Active hardware",
          owner: "Engineering Manager",
        },
      ],
    },
    {
      id: "t_visibility",
      title: "Driving with poor visibility",
      barriers: [
        {
          id: "b_weather2",
          title: "Driver checks weather and adjusts schedule to avoid fog",
          type: "Active Human",
          owner: "Supervisor",
        },
        { id: "b_def", title: "Defensive driving", type: "Active Human", owner: "HSE Manager" },
      ],
    },
  ],
  consequences: [
    {
      id: "c_fixed",
      title: "Crash into a fixed object",
      barriers: [
        {
          id: "b_fcw",
          title: "Forward collision warning & defensive driving",
          type: "Active hardware + Human",
          owner: "Supervisor",
        },
        {
          id: "b_crumple",
          title: "Crumple zone",
          type: "Passive hardware",
          owner: "EN Engineer",
        },
      ],
    },
    {
      id: "c_internal",
      title: "Driver impacts internals of the vehicle",
      barriers: [
        {
          id: "b_seatbelt",
          title: "Seatbelt prevents driver from colliding with internals",
          type: "Passive hardware",
          owner: "Engineering Manager",
        },
        {
          id: "b_airbag",
          title: "Airbag",
          type: "Passive hardware",
          owner: "Engineering Manager",
        },
      ],
    },
    {
      id: "c_rollover",
      title: "Vehicle roll-over",
      barriers: [
        {
          id: "b_rollprot",
          title: "Rollover protection (reinforced structure)",
          type: "Passive hardware",
          owner: "Engineering Manager",
        },
      ],
    },
  ],
};

const NODE_TYPES: NodeTypes = {
  box: BoxNode,
  top: TopEventNode,
  sign: SignNode,
};

const BOX_W = 240;
const COL_GAP = 40;
const COL_SPACING = BOX_W + COL_GAP;

// Simple layout columns
const COLS = {
  left: 0,
  leftBarriers: 260,
  centerHazard: 520,
  centerTop: 520,
  rightBarriers: 780,
  right: 1040,
};

// Vertical spacing
const Y_START = 0;
const Y_STEP = 140;

export default function BowtieFlow() {
  const [expandedThreats, setExpandedThreats] = useState<string[]>([]);
  const [expandedConsequences, setExpandedConsequences] = useState<string[]>([]);
  const [expandedBarriers, setExpandedBarriers] = useState<string[]>([]);
  const rf = useRef<ReactFlowInstance | null>(null);

  const toggleThreat = (id: string) => {
    console.log("toggleThreat called with", id);
    setExpandedThreats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleConsequence = (id: string) => {
    setExpandedConsequences(prev => prev.includes(id)
      ? prev.filter(x => x !== id)
      : [...prev, id]
    );
  };

  const toggleBarrier = (id: string) => {
    setExpandedBarriers(prev => prev.includes(id)
      ? prev.filter(x => x !== id)
      : [...prev, id]
    );
  };

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = React.useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const computeGraph = React.useCallback((): { nodes: Node[]; edges: Edge[] } => {
    console.log("expandedThreats:", Array.from(expandedThreats));
    console.log("expandedConsequences:", Array.from(expandedConsequences));
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Hazard sign
    nodes.push({
      id: "hazard",
      type: "sign",
      position: { x: COLS.centerHazard - 130, y: -140 },
      data: { title: DATA.hazard } as SignData,
    });

    // Top event with three named handles
    nodes.push({
      id: "top",
      type: "top",
      position: { x: COLS.centerTop - 90, y: 120 },
      data: { title: DATA.topEvent } as TopEventData,
    });

    // Connect hazard -> top
    edges.push({ id: "hazard->top", source: "hazard", target: "top", targetHandle: "top" });

    // LEFT (Threats)
    let yLeft = Y_START;
    DATA.threats.forEach((t) => {
      const threatId = `threat-${t.id}`;
      const isOpen = expandedThreats.includes(threatId);

      // where the top event sits
      const TOP_X = COLS.centerTop - 90;

      // the barrier nearest the top should sit immediately to the LEFT of the top node
      const rightMostBarrierX = TOP_X - (COL_GAP + BOX_W);

      // If expanded, position the threat to the left of the left-most barrier.
      // If collapsed, keep the original column.
      let threatX = COLS.left;

      // precompute barrier positions when open
      let barrierIds: string[] = [];
      let barrierPositions: { id: string; x: number; y: number }[] = [];

      if (isOpen) {
        const n = t.barriers.length;

        // left-most barrier x (so the last barrier touches rightMostBarrierX)
        const leftMostBarrierX = rightMostBarrierX - (Math.max(n, 1) - 1) * COL_SPACING;

        // threat sits one column left of the left-most barrier
        threatX = leftMostBarrierX - COL_SPACING;
      }

      // THREAT NODE
      nodes.push({
        id: threatId,
        type: "box",
        position: { x: threatX, y: yLeft },
        data: {
          title: t.title,
          headerColor: "#2563eb",
          side: "left",
          kind: 'threat',
          onToggle: () => toggleThreat(threatId),
        } as BoxNodeData,
      });

      if (!isOpen) {
        // collapsed: direct link to top (left handle)
        edges.push({ id: `${threatId}->top`, source: threatId, target: "top", targetHandle: "left" });
      } else {
        // expanded: barriers in a horizontal chain ending next to the top node
        const n = t.barriers.length;
        const y = yLeft;

        const leftMostBarrierX = rightMostBarrierX - (Math.max(n, 1) - 1) * COL_SPACING;

        t.barriers.forEach((b, i) => {
          const id = `bar-${b.id}`;
          const x = leftMostBarrierX + i * COL_SPACING;

          barrierIds.push(id);
          barrierPositions.push({ id, x, y });

          nodes.push({
            id,
            type: "box",
            position: { x, y },
            data: {
              title: b.title,
              side: "left",
              kind: 'barrier',
              headerColor: colorForType(b.type),
              chips: [b.type, b.owner].filter(Boolean) as string[],
              onToggle: () => toggleBarrier(id),
            } as BoxNodeData,
          });
        });

        // chain edges: threat -> first barrier -> ... -> last barrier -> TOP(left)
        if (barrierIds.length) {
          edges.push({ id: `${threatId}->${barrierIds[0]}`, source: threatId, target: barrierIds[0] });
          for (let i = 0; i < barrierIds.length - 1; i++) {
            edges.push({ id: `${barrierIds[i]}->${barrierIds[i + 1]}`, source: barrierIds[i], target: barrierIds[i + 1] });
          }
          edges.push({ id: `${barrierIds.at(-1)}->top`, source: barrierIds.at(-1)!, target: "top", targetHandle: "left" });
        } else {
          edges.push({ id: `${threatId}->top`, source: threatId, target: "top", targetHandle: "left" });
        }
      }

      yLeft += Y_STEP;
    });

    // RIGHT (Consequences)
    let yRight = Y_START;
    DATA.consequences.forEach((c) => {
      const consId = `cons-${c.id}`;
      const isOpen = expandedConsequences.includes(consId);

      // If open, shove the consequence one column further right to make room
      const consX = isOpen ? COLS.right + COL_SPACING : COLS.right;

      nodes.push({
        id: consId,
        type: "box",
        position: { x: consX, y: yRight },
        data: {
          title: c.title,
          headerColor: "#dc2626",
          side: "right",
          kind: 'consequence',
          onToggle: () => toggleConsequence(consId),
        } as BoxNodeData,
      });

      // When collapsed: TOP(right) -> consequence directly
      if (!isOpen) {
        edges.push({ id: `top->${consId}`, source: "top", sourceHandle: "right", target: consId });
      }

      if (isOpen) {
        const y = yRight;
        const ids: string[] = [];

        c.barriers.forEach((b, i) => {
          const barrierId = `bar-${b.id}`;
          const x = COLS.rightBarriers + i * COL_SPACING; // march rightwards
          ids.push(barrierId);

          nodes.push({
            id: barrierId,
            type: "box",
            position: { x, y },
            data: {
              title: b.title,
              side: "right",
              kind: 'barrier',
              headerColor: colorForType(b.type),
              chips: [b.type, b.owner].filter(Boolean) as string[],
              onToggle: () => toggleBarrier(barrierId),
            } as BoxNodeData,
          });
        });

        // chain edges: TOP(right) -> first barrier -> ... -> last barrier -> consequence
        if (ids.length) {
          edges.push({ id: `top->${ids[0]}`, source: "top", sourceHandle: "right", target: ids[0] });
          for (let i = 0; i < ids.length - 1; i++) {
            edges.push({ id: `${ids[i]}->${ids[i + 1]}`, source: ids[i], target: ids[i + 1] });
          }
          edges.push({ id: `${ids.at(-1)}->${consId}`, source: ids.at(-1)!, target: consId });
        } else {
          // no barriers defined: fallback direct link
          edges.push({ id: `top->${consId}`, source: "top", sourceHandle: "right", target: consId });
        }
      }

      yRight += Y_STEP;
    });

    return { nodes, edges };
  }, [expandedThreats, expandedConsequences, expandedBarriers]);

  React.useEffect(() => {
    const g = computeGraph();
    setNodes(g.nodes);
    setEdges(g.edges);
    rf.current?.fitView({ padding: 0.2 });
    console.log('graph', { nodes: g.nodes.length, edges: g.edges.length });
  }, [computeGraph]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <div style={{ position: "fixed", top: 12, left: 12, zIndex: 50, display: "flex", gap: 8 }}>
        <span style={{ fontSize: 12, opacity: 0.8 }}>Tip: Click a threat/consequence to expand. Click a barrier to expand its failure event.</span>
      </div>
      <ReactFlow
        onInit={(instance) => { rf.current = instance; }}
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        nodesDraggable
        nodesConnectable={false}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{ animated: false }}
      >
        <Background />
        <MiniMap pannable zoomable />
        <Controls />
      </ReactFlow>
    </div>
  );
}
