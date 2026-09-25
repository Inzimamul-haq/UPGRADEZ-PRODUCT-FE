import { GraphDisplay } from './components/GraphDisplay';
import { TreeDisplay } from './components/TreeDisplay';
import { CircuitDisplay } from './components/mech_structural/CircuitDisplay';
import { SchematicDisplay } from './components/schemantic/SchematicDisplay';
import { GeometryDisplay } from './components/geomentry/GeometryDisplay';
import { StructuralDisplay } from './components/structural/StructuralDisplay';
import { BlockDisplay } from './components/block/BlockDisplay';
import { FlowchartDisplay } from './components/FlowchartDisplay';
import { ArchitectureDisplay } from './components/ArchitectureDisplay';
import { NetworkDisplay } from './components/NetworkDisplay';
import { WaveformDisplay } from './components/WaveformDisplay';
import { TableDisplay } from './components/TableDisplay';
import { MechStructuralDisplay } from './components/mech_structural/MechStructuralDisplay';
import { EngineeringDrawingDisplay } from './components/geomentry/EngineeringDrawingDisplay';

interface DiagramRendererProps {
  type: string;
  subtype?: string;
  spec: any;
  width?: number;
  height?: number;
}

export function DiagramRenderer({ type, subtype, spec, width = 260, height = 260 }: DiagramRendererProps) {
  if (!spec || Object.keys(spec).length === 0) {
    return (
      <div className="text-xs text-[#6C6C6A] italic flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md h-[100px] w-full mt-2">
        [Visual: {type} — no data provided]
      </div>
    );
  }

  switch (type) {
    case 'engineering_drawing':
      return <EngineeringDrawingDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'graph':
      return <GraphDisplay graph={spec} width={width} height={height} />;
    case 'tree':
      return <TreeDisplay tree={spec} width={width} height={height} />;
    case 'circuit':
      return <CircuitDisplay circuit={spec} subtype={subtype} width={width} height={height} />;
    case 'schematic':
      return <SchematicDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'geometry':
      return <GeometryDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'mech_structural':
      return <MechStructuralDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'structural':
      return <StructuralDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'block':
      return <BlockDisplay data={spec} subtype={subtype} width={width} height={height} />;
    // case 'flowchart':
    //   return <FlowchartDisplay data={spec} subtype={subtype} width={width} height={height} />;
    // case 'architecture':
    //   return <ArchitectureDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'network':
      return <NetworkDisplay data={spec} subtype={subtype} width={width} height={height} />;
    // case 'waveform':
    //   return <WaveformDisplay data={spec} subtype={subtype} width={width} height={height} />;
    // case 'table':
      // return <TableDisplay data={spec} subtype={subtype} width={width} height={height} />;
    case 'logic_gate':
      return <SchematicDisplay data={spec} subtype="logic_gate" width={width} height={height} />;
    case 'free_body':
      return <GeometryDisplay data={spec} subtype="free_body" width={width} height={height} />;
    case 'linked_list':
    case 'doubly_linked_list':
      return <StructuralDisplay data={spec} subtype={type} width={width} height={height} />;
    case 'image':
      if (!spec.url) {
        return (
          <div className="text-xs text-[#6C6C6A] italic flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md h-[100px] w-full mt-2">
            [Image: URL missing]
          </div>
        );
      }
      return (
        <img
          src={spec.url}
          alt="Uploaded diagram"
          className="uploaded-diagram-image"
          style={{ maxWidth: '100%', maxHeight: height, objectFit: 'contain', display: 'block', margin: '0 auto' }}
        />
      );
    default:
      // Unknown type — show a placeholder so the question isn't broken
      return (
        <div className="text-xs text-[#6C6C6A] italic flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md h-[100px] w-full mt-2">
          [Visual: {type} — renderer not yet available]
        </div>
      );
  }
}
