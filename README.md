# Bowtie Risk Visualization
An interactive Bowtie Diagram built with ReactFlow, Vite, and TypeScript, designed to visualize the relationships between hazards, threats, top events, barriers, and consequences.

Live Demo: https://bowtie-diagram-5122.vercel.app/

## Overview
This visualization models a typical bowtie risk analysis structure, focusing on the instance of driving a commercial vehicle on the highway:
- Hazard at the top, the initiating context or condition.
- Top Event in the center, the main undesired event
- Threats on the left, causes leading toward the top event.
- Consequences on the right — outcomes resulting from the top event.
- Barriers between threats/consequences and the top event, preventive or mitigating measures.

Clicking on a threat or consequence expands it to show its associated barriers in a horizontal chain.
Each barrier can also be expanded in future iterations to show underlying failure causes or assurance actions.

## How to Use
1. Open the live link in any browser
2. Click any threat or consequence node to expand or collapse its barriers.
3. Drag nodes around to explore different relationships.
4. Zoom and pan using your mouse.
5. Use the on-screen controls (bottom-right corner) to reset or navigate the view.

## Technical Stack
- Frontend: React + TypeScript
- Visualization Engine: ReactFlow
- Styling: Tailwind CSS
- Build Tool: Vite
- Deployment: Vercel