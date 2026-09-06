import { GraphDisplay } from './GraphDisplay';
import { TreeDisplay } from './TreeDisplay';
import { CircuitDisplay } from './CircuitDisplay';
import { LogicGateDisplay } from './LogicGateDisplay';
import { FreeBodyDisplay } from './FreeBodyDisplay';
import { LinkedListDisplay } from './LinkedListDisplay';
import { BucketsDisplay } from './BucketsDisplay';

interface DiagramRendererProps {
  type: string;
  spec: any;
  width?: number;
  height?: number;
}

export function DiagramRenderer({ type, spec, width = 260, height = 260 }: DiagramRendererProps) {
  switch (type) {
    case 'graph':
      return <GraphDisplay graph={spec} width={width} height={height} />;
    case 'tree':
      return <TreeDisplay tree={spec} width={width} height={height} />;
    case 'circuit':
      return <CircuitDisplay circuit={spec} width={width} height={height} />;
    case 'logic_gate':
      return <LogicGateDisplay logic={spec} width={width} height={height} />;
    case 'free_body':
      return <FreeBodyDisplay fbd={spec} width={width} height={height} />;
    case 'linked_list':
      return <LinkedListDisplay list={spec} width={width} height={height} />;
    case 'buckets':
      return <BucketsDisplay data={spec} width={width} height={height} />;
    default:
      // Unknown type — show a placeholder so the question isn't broken
      return (
        <div className="text-xs text-[#6C6C6A] italic flex items-center justify-center border border-dashed border-[#3A3A38] rounded-md h-[100px] w-full mt-2">
          [Visual: {type} — renderer not yet available]
        </div>
      );
  }
}
