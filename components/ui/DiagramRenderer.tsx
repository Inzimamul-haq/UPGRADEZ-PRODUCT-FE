import { GraphDisplay } from './GraphDisplay';
import { TreeDisplay } from './TreeDisplay';
import { CircuitDisplay } from './CircuitDisplay';
import { SchematicDisplay } from './SchematicDisplay';
import { GeometryDisplay } from './GeometryDisplay';
import { StructuralDisplay } from './StructuralDisplay';
import { BlockDisplay } from './BlockDisplay';
import { FlowchartDisplay } from './FlowchartDisplay';
import { ArchitectureDisplay } from './ArchitectureDisplay';
import { NetworkDisplay } from './NetworkDisplay';
import { WaveformDisplay } from './WaveformDisplay';
import { TableDisplay } from './TableDisplay';

interface DiagramRendererProps {
  type: string;
  subtype?: string;
  spec: any;
  width?: number;
  height?: number;
}

export function DiagramRenderer({ type, subtype, spec, width = 260, height = 260 }: DiagramRendererProps) {
  switch (type) {
    case 'graph':
      return <GraphDisplay graph={spec} width={width} height={height} />;
    case 'tree':
      return <TreeDisplay tree={spec} width={width} height={height} />;
    case 'circuit':
      return <CircuitDisplay circuit={spec} width={width} height={height} />;
    case 'schematic':
      return <SchematicDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'geometry':
      return <GeometryDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'structural':
      return <StructuralDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'block':
      return <BlockDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'flowchart':
      return <FlowchartDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'architecture':
      return <ArchitectureDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'network':
      return <NetworkDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'waveform':
      return <WaveformDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'table':
      return <TableDisplay data={spec} subtype={subtype} width={width} height={height} />;
    default:
      // Unknown type — show a placeholder so the question isn't broken
      return (
        <div className="text-xs text-[#6C6C6A] italic flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md h-[100px] w-full mt-2">
          [Visual: {type} — renderer not yet available]
        </div>
      );
  }
}
