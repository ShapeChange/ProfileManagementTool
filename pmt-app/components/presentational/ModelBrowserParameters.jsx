import React, { Component } from 'react';
import { Table, Input, Label, Form, FormGroup } from 'reactstrap';
import Toggle from '../common/Toggle'
import TooltipIcon from '../common/TooltipIcon'


class ModelBrowserParameters extends Component {

    _parseMultiplicity = () => {
        const { isProperty, infos, profileParameters, selectedProfile } = this.props;

        let multiplicity = {
            min: 0,
            max: 0,
            minValue: 0,
            maxValue: 0,
            maxUnbounded: false,
            maxValueUnbounded: false
        }

        if (isProperty && infos && infos.cardinality) {
            let bounds = infos.cardinality.split('..')
            multiplicity.min = multiplicity.minValue = parseInt(bounds[0])
            multiplicity.max = multiplicity.maxValue = parseInt(bounds[1])
            multiplicity.maxUnbounded = multiplicity.maxValueUnbounded = bounds[1] === '*'

            if (profileParameters[selectedProfile] && profileParameters[selectedProfile].multiplicity) {
                //console.log(profileParameters[selectedProfile].multiplicity)
                bounds = profileParameters[selectedProfile].multiplicity.split('..')
                multiplicity.minValue = parseInt(bounds[0])
                multiplicity.maxValue = parseInt(bounds[1])
                multiplicity.maxValueUnbounded = bounds[1] === '*'
            }
        }
        //console.log(multiplicity);

        return multiplicity
    }

    _parseGeometries = () => {
        const { isClass, taggedValues, allowedGeometries } = this.props;

        //const defaultGeometries = ['P', 'C', 'S', 'So', 'MP', 'MC', 'MS', 'MSo']

        let geometries = allowedGeometries

        if (isClass && taggedValues && taggedValues.geometry) {
            geometries = this._mergeGeometries(geometries, taggedValues.geometry.split(','))
        }

        return geometries
    }

    //TODO: to pmt-util
    _mergeGeometries = (geos, restriction) => {
        return restriction.reduce((result, g) => {
            if (geos.indexOf(g) > -1)
                result.push(g)
            return result
        }, [])
    }

    _writeMultiplicity = (multiplicity) => {

        return `${multiplicity.minValue}..${multiplicity.maxValueUnbounded ? '*' : multiplicity.maxValue}`
    }

    _updateMinCardinality = (e) => {
        const multiplicity = this._parseMultiplicity();

        multiplicity.minValue = e.target.value

        this._updateCardinality(this._writeMultiplicity(multiplicity))
    }

    _updateMaxCardinality = (e) => {
        const { updateProfileParameter, infos } = this.props;
        const multiplicity = this._parseMultiplicity();

        if (e.target.type === 'checkbox' && e.target.checked)
            multiplicity.maxValueUnbounded = true;
        else if (e.target.type === 'checkbox' && !e.target.checked) {
            multiplicity.maxValueUnbounded = false;
            multiplicity.maxValue = multiplicity.minValue === 0 ? 1 : multiplicity.minValue;
        }
        else
            multiplicity.maxValue = e.target.value;

        if ((multiplicity.max > 1 || multiplicity.maxUnbounded) && !multiplicity.maxValueUnbounded && multiplicity.maxValue <= 1) {
            updateProfileParameter(this.props, {
                isOrdered: 'false',
                isUnique: 'true',
                multiplicity: this._writeMultiplicity(multiplicity)
            });
        } else if ((multiplicity.max > 1 || multiplicity.maxUnbounded) && (multiplicity.maxValueUnbounded || multiplicity.maxValue > 1)) {
            updateProfileParameter(this.props, {
                isOrdered: `${infos.isOrdered}`,
                isUnique: `${infos.isUnique}`,
                multiplicity: this._writeMultiplicity(multiplicity)
            });
        } else {
            this._updateCardinality(this._writeMultiplicity(multiplicity))
        }
    }

    _updateCardinality = (multiplicity) => {
        const { updateProfileParameter } = this.props;
        updateProfileParameter(this.props, 'multiplicity', multiplicity)
    }

    _updateIsOrdered = () => {
        this._updateFlag('isOrdered');
    }

    _updateIsUnique = () => {
        this._updateFlag('isUnique');
    }

    _updateIsAbstract = () => {
        this._updateFlag('isAbstract');
    }

    _updateFlag = (flag) => {
        const { profileParameters, selectedProfile, infos, updateProfileParameter } = this.props;
        let value = null;
        if (!profileParameters[selectedProfile] || !profileParameters[selectedProfile][flag]) {
            value = `${!infos[flag]}`;
        }

        console.log(flag, profileParameters[selectedProfile] ? profileParameters[selectedProfile][flag] : null, infos[flag], value)
        updateProfileParameter(this.props, flag, value)
    }

    render() {
        const { _id, isClass, isProperty, disabled, infos, profileParameters, selectedProfile, allowedGeometries, updateProfileParameter, t } = this.props;

        const multiplicity = isProperty && this._parseMultiplicity();

        const geometries = isClass && this._parseGeometries();

        return (
            <div>
                <div className="font-weight-bold py-1">
                    {t('parameter')}
                </div>
                <Table size="sm" reflow>
                    <tbody>
                        {isClass && infos && infos.stereotypes === 'featuretype' &&
                            <tr>
                                <td className="pl-0 pr-3 border-0">
                                    <span className="align-self-center">{t('geometry')}</span>
                                </td>
                                <td className="pl-0 border-0 py-0" style={{ width: '100%' }}>
                                    <Input type="select"
                                        name="selectMulti"
                                        multiple
                                        disabled={disabled}
                                        size="sm"
                                        style={{ width: '75px', height: '150px' }}
                                        value={(profileParameters[selectedProfile] && profileParameters[selectedProfile].geometry) || allowedGeometries}
                                        onChange={e => updateProfileParameter(this.props, 'geometry', [...e.target.selectedOptions].map(o => o.value))}>
                                        {geometries.map(g => <option key={g}>
                                            {g}
                                        </option>)}
                                    </Input>
                                </td>
                            </tr>}
                        {isClass && infos && !infos.isAbstract &&
                            <tr>
                                <td className="pl-0 pr-3 border-0">
                                    <span className="align-self-center">{t('isAbstract')}</span>
                                </td>
                                <td className="pl-0 border-0 py-0">
                                    <span className=""><Toggle name="isAbstract"
                                        disabled={disabled}
                                        checked={profileParameters[selectedProfile] ? profileParameters[selectedProfile].isAbstract === 'true' ? true : profileParameters[selectedProfile].isAbstract === 'false' ? false : infos.isAbstract === true : infos.isAbstract === true}
                                        onToggle={this._updateIsAbstract} /></span>
                                </td>
                            </tr>}
                        {isProperty && infos && !infos.isAttribute &&
                            <tr>
                                <td className="pl-0 pr-3 border-0">
                                    <span className="align-self-center">{t('isNavigable')}</span>
                                </td>
                                <td className="pl-0 border-0 py-0">
                                    <span className=""><Toggle name="isNavigable"
                                        disabled={disabled || !infos.isNavigable}
                                        checked={infos.isNavigable && !(profileParameters[selectedProfile] && profileParameters[selectedProfile].isNavigable === 'false')}
                                        onToggle={e => updateProfileParameter(this.props, 'isNavigable', !(profileParameters[selectedProfile] && profileParameters[selectedProfile].isNavigable === 'false') ? 'false' : 'true')}> </Toggle></span>
                                </td>
                            </tr>}
                        {isProperty &&
                            <tr>
                                <td className="pl-0 pr-3 border-0">
                                    {t('cardinality')}
                                </td>
                                <td className="pl-0 border-0" style={{ width: '100%' }}>
                                    <Form inline>
                                        <FormGroup>
                                            <Input type="number"
                                                size='sm'
                                                name="minOccurs"
                                                style={{ width: '75px' }}
                                                readOnly={disabled}
                                                value={multiplicity.minValue}
                                                min={multiplicity.min}
                                                max={multiplicity.maxValue}
                                                onChange={this._updateMinCardinality}
                                                onKeyDown={e => e.preventDefault()} />
                                            <span className="px-1">..</span>
                                            <Input type="number"
                                                size='sm'
                                                name="maxOccurs"
                                                style={{ width: '75px' }}
                                                value={multiplicity.maxValue}
                                                min={multiplicity.minValue || 1}
                                                max={multiplicity.max}
                                                readOnly={disabled || multiplicity.maxValueUnbounded}
                                                onChange={this._updateMaxCardinality}
                                                onKeyDown={e => e.preventDefault()} />
                                            {' '}
                                            <FormGroup check className="pl-3">
                                                <Label check>
                                                    <Input type="checkbox"
                                                        checked={multiplicity.maxValueUnbounded}
                                                        disabled={disabled || !multiplicity.maxUnbounded}
                                                        onChange={this._updateMaxCardinality} /> *
                                              </Label>
                                            </FormGroup>
                                        </FormGroup>
                                    </Form>
                                    { /* profileParameters[selectedProfile] ? profileParameters[selectedProfile].multiplicity : infos.cardinality */}
                                </td>
                            </tr>}
                        {isProperty && infos && (multiplicity.max > 1 || multiplicity.maxUnbounded) &&
                            <tr>
                                <td className="pl-0 pr-3 border-0">
                                    <span className="align-self-center">{t('isOrdered')}</span>
                                    {!(multiplicity.maxValue > 1 || multiplicity.maxValueUnbounded) &&
                                        <TooltipIcon id={`${_id}-isOrdered-warning`}
                                            placement="right"
                                            className="ml-1"
                                            icon="warning"
                                            color="warning">
                                            {t('paramMaxCardinalityOne')}
                                        </TooltipIcon>}
                                </td>
                                <td className="pl-0 border-0 py-0">
                                    <span className=""><Toggle name="isOrdered"
                                        label={` (model setting: ${infos.isOrdered === true})`}
                                        disabled={disabled || !(multiplicity.maxValue > 1 || multiplicity.maxValueUnbounded)}
                                        checked={profileParameters[selectedProfile] ? profileParameters[selectedProfile].isOrdered === 'true' ? true : profileParameters[selectedProfile].isOrdered === 'false' ? false : infos.isOrdered === true : infos.isOrdered === true}
                                        onToggle={this._updateIsOrdered} /></span>
                                </td>
                            </tr>}
                        {isProperty && infos && (multiplicity.max > 1 || multiplicity.maxUnbounded) &&
                            <tr>
                                <td className="pl-0 pr-3 border-0">
                                    <span className="align-self-center">{t('isUnique')}</span>
                                    {!(multiplicity.maxValue > 1 || multiplicity.maxValueUnbounded) &&
                                        <TooltipIcon id={`${_id}-isUnique-warning`}
                                            placement="right"
                                            className="ml-1"
                                            icon="warning"
                                            color="warning">
                                            {t('paramMaxCardinalityOne')}
                                        </TooltipIcon>}
                                </td>
                                <td className="pl-0 border-0 py-0">
                                    <span className=""><Toggle name="isUnique"
                                        label={` (model setting: ${infos.isUnique !== false})`}
                                        disabled={disabled || !(multiplicity.maxValue > 1 || multiplicity.maxValueUnbounded)}
                                        checked={profileParameters[selectedProfile] ? profileParameters[selectedProfile].isUnique === 'true' ? true : profileParameters[selectedProfile].isUnique === 'false' ? false : infos.isUnique !== false : infos.isUnique !== false}
                                        onToggle={this._updateIsUnique} /></span>
                                </td>
                            </tr>}
                    </tbody>
                </Table>
            </div>
        );
    }
}
;

export default ModelBrowserParameters
